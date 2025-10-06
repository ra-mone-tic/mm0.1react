import maplibregl from 'maplibre-gl';
import { getEventDateLabel, extractTimeFromText, getTimeAgoText } from './time.js';
import { CACHE_URL, JSON_URL } from '../config.js';

// Переменные для кэша геокоординат
let geocodeCache = {};
let cacheLoaded = false;

// Кастомный контрол навигации без кнопки компаса
export class CustomNavigationControl {
  onAdd(map) {
    this._map = map;
    this._container = document.createElement('div');
    this._container.className = 'maplibregl-ctrl maplibregl-ctrl-group';

    // Кнопка увеличения масштаба
    const zoomInButton = this._createButton('zoom-in', 'Увеличить масштаб', () => {
      this._map.zoomIn();
    });

    // Кнопка уменьшения масштаба
    const zoomOutButton = this._createButton('zoom-out', 'Уменьшить масштаб', () => {
      this._map.zoomOut();
    });

    this._container.appendChild(zoomInButton);
    this._container.appendChild(zoomOutButton);

    return this._container;
  }

  onRemove() {
    if (this._container && this._container.parentNode) {
      this._container.parentNode.removeChild(this._container);
    }
    this._map = undefined;
  }

  _createButton(className, title, fn) {
    const button = document.createElement('button');
    button.className = `maplibregl-ctrl-${className}`;
    button.type = 'button';
    button.title = title;
    button.setAttribute('aria-label', title);

    // Добавляем иконки с правильным стилем
    if (className === 'zoom-in') {
      button.innerHTML = '<span style="font-size: 18px; line-height: 1; font-weight: bold;">+</span>';
    } else if (className === 'zoom-out') {
      button.innerHTML = '<span style="font-size: 18px; line-height: 1; font-weight: bold;">−</span>';
    }

    button.addEventListener('click', fn);

    return button;
  }
}

// Функции для работы с кэшем координат
export function loadGeocodeCache() {
  return fetch(CACHE_URL)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    })
    .then(cache => {
      geocodeCache = cache;
      cacheLoaded = true;
      console.log(`Кэш координат загружен: ${Object.keys(cache).length} адресов`);
      return cache;
    })
    .catch(error => {
      console.error('Ошибка загрузки кэша координат:', error);
      geocodeCache = {};
      cacheLoaded = true;
      return {};
    });
}

export function getCoordinatesFromCache(location) {
  if (!cacheLoaded || !location) return null;

  // Нормализуем адрес для поиска
  const normalizedLocation = location.trim();

  // Ищем точное совпадение
  if (geocodeCache[normalizedLocation]) {
    return geocodeCache[normalizedLocation];
  }

  // Ищем частичное совпадение (если адрес содержит Калининград)
  for (const [cachedLocation, coordinates] of Object.entries(geocodeCache)) {
    if (normalizedLocation.includes(cachedLocation) || cachedLocation.includes(normalizedLocation)) {
      return coordinates;
    }
  }

  return null;
}

export function updateEventCoordinates(event) {
  // Если у события уже есть координаты, используем их
  if (event.lat && event.lon) {
    return event;
  }

  // Ищем координаты в кэше
  const coordinates = getCoordinatesFromCache(event.location);
  if (coordinates) {
    event.lat = coordinates[0];
    event.lon = coordinates[1];
    console.log(`Найдены координаты для "${event.location}": [${coordinates[0]}, ${coordinates[1]}]`);
  } else {
    console.warn(`Координаты не найдены для "${event.location}"`);
  }

  return event;
}

// Функция генерации ID события
export function makeEventId(event) {
  const source = `${event.date}|${event.title}|${event.lat}|${event.lon}`;
  let hash = 5381;
  for (let i = 0; i < source.length; i += 1) {
    hash = ((hash << 5) + hash) + source.charCodeAt(i);
  }
  return `e${(hash >>> 0).toString(16)}`;
}

// Функции для работы с картой и маркерами
let popupStates = new Map();
let markers = [];
let markerById = new Map();

export function clearMarkers() {
  markers.forEach(marker => marker.remove());
  markers.length = 0;
  markerById.clear();
  popupStates.clear();
}

function formatLocation(location) {
  if (!location) return '';
  return location.replace(/,?\s*Калининград\s*$/i, '');
}

export function popupTemplate(event) {
  const shareButton = `
    <button class="share-btn" type="button" title="Скопировать ссылку" onclick="window.copyShareLink('${event.id}')" style="position:absolute;right:16px;bottom:8px;border:var(--border);background:var(--surface-2);border-radius:var(--radius-xs);padding:4px 6px;cursor:pointer;font-size:14px;line-height:1;color:var(--text-0);z-index:10;">
      🔗
    </button>`;

  // Текст поста (без хештегов, даты и заголовка)
  let postText = event.text || '';
  postText = postText.replace(/#[^\s#]+/g, '').trim();
  postText = postText.replace(/^.*\n/, '').trim();

  // Показываем только первые 90 символов в свернутом виде
  const COLLAPSED_LIMIT = 90;
  const isLong = postText.length > COLLAPSED_LIMIT;
  const shortText = isLong ? postText.slice(0, COLLAPSED_LIMIT) : postText;

  // Новая ручка - только одна полоска внизу
  const handle = isLong ? '<div class="popup-handle" style="position:absolute;bottom:0;left:0;right:0;height:8px;cursor:pointer;z-index:5;display:flex;align-items:center;justify-content:center;"><div style="width:46px;height:5px;border-radius:999px;background:color-mix(in srgb, var(--text-1) 25%, transparent);"></div></div>' : '';

  return `
    <div style="position:relative;padding:8px 8px 28px 8px;min-width:220px;max-width:320px;">
      <div><strong>${event.title}</strong></div>
      <div>${formatLocation(event.location)}</div>
      <div style="color:var(--text-1);">${getEventDateLabel(event.date, event.text)}</div>
      <div class="popup-text" style="margin:8px 0 0 0;max-height:72px;overflow:hidden;position:relative;">
        <span class="popup-text-short">${shortText}${isLong ? '…' : ''}</span>
      </div>
      <div class="popup-text-full" style="display:none;max-height:160px;overflow:auto;margin:8px 0 0 0;">${postText.replace(/\n/g, '<br>')}</div>
      ${handle}
      ${shareButton}
    </div>
  `;
}

export function addMarker(event, onSelectEvent, map) {
  // Если карта не передана, используем window.currentMap
  const targetMap = map || window.currentMap || window.mapInstance;
  if (!targetMap) {
    console.warn('Карта недоступна для addMarker');
    return;
  }

  // Отладка: проверка координат
  if (!event.lat || !event.lon) {
    console.warn('У события нет координат:', event);
    return;
  }

  console.log('Добавляю маркер для:', event.title, [event.lon, event.lat]);

  const popup = new maplibregl.Popup({ offset: 24, closeButton: false }).setHTML(popupTemplate(event));
  const marker = new maplibregl.Marker().setLngLat([event.lon, event.lat]).setPopup(popup).addTo(targetMap);
  markers.push(marker);
  if (event.id) {
    markerById.set(event.id, marker);
  }

  let popupState = { expanded: false };

  // popup expand/collapse logic как в оригинале
  function toggleText(popupEl) {
    const shortText = popupEl.querySelector('.popup-text-short');
    const fullText = popupEl.querySelector('.popup-text-full');
    const handle = popupEl.querySelector('.popup-handle');

    if (!shortText || !fullText) return;

    if (popupState.expanded) {
      // Свернуть
      shortText.style.display = 'inline';
      fullText.style.display = 'none';
      popupState.expanded = false;
    } else {
      // Развернуть
      shortText.style.display = 'none';
      fullText.style.display = 'block';
      popupState.expanded = true;
    }
  }

  popup.on('open', () => {
    const popupEl = popup.getElement();
    if (!popupEl) return;

    const handle = popupEl.querySelector('.popup-handle');
    if (handle) {
      handle.onclick = () => toggleText(popupEl);
    }
  });

  popup.on('close', () => {
    const popupEl = popup.getElement();
    if (!popupEl) return;

    // Сбрасываем состояние при закрытии
    const shortText = popupEl.querySelector('.popup-text-short');
    const fullText = popupEl.querySelector('.popup-text-full');
    if (shortText && fullText) {
      shortText.style.display = 'inline';
      fullText.style.display = 'none';
      popupState.expanded = false;
    }
  });

  // Клик маркера
  marker.getElement().addEventListener('click', () => {
    if (onSelectEvent) {
      onSelectEvent(event);
    }
  });

  return marker;
}

export function renderDay(dateStr, allEvents, recenter = true) {
  if (!dateStr || !allEvents.length) {
    clearMarkers();
    return [];
  }

  clearMarkers();
  const todays = allEvents.filter(event => event.date === dateStr);
  todays.forEach(event => addMarker(event, () => {})); // Пустой callback, переопределим позже

  // Округление flyTo для центрирования
  return todays;
}

export function highlightMarker(eventId) {
  // Найти маркер и открыть/закрыть попап
  const marker = markerById.get(eventId);
  if (marker) {
    marker.togglePopup();
    return true;
  }
  return false;
}
