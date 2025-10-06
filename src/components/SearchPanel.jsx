import { useState, useEffect, useRef, useCallback } from 'react';
import { searchEvents } from '../utils/search.js';
import { debounce } from '../utils/time.js';

function SearchPanel({ events }) {
  const [query, setQuery] = useState('');
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [dragStartY, setDragStartY] = useState(null);

  const searchInputRef = useRef(null);
  const searchPanelRef = useRef(null);
  const searchResultsRef = useRef(null);
  const searchEmptyRef = useRef(null);
  const searchLabelRef = useRef(null);

  // Функции открытия/закрытия панели
  const openSearchPanel = useCallback(() => {
    if (!searchPanelRef.current || isPanelOpen) return;

    // Обновляем offset для панели
    document.documentElement.style.setProperty('--search-panel-offset', '82px');

    searchPanelRef.current.classList.add('open');
    searchPanelRef.current.setAttribute('aria-hidden', 'false');
    setIsPanelOpen(true);

    renderSearchResults(searchInputRef.current?.value ?? '');

    // Перерисовываем карту
    if (window.mapInstance) {
      window.mapInstance.resize();
    }
  }, [isPanelOpen, renderSearchResults]);

  const closeSearchPanel = useCallback(({ blur = true } = {}) => {
    if (!searchPanelRef.current || !isPanelOpen) {
      if (blur && searchInputRef.current) {
        searchInputRef.current.blur();
      }
      return;
    }

    searchPanelRef.current.classList.remove('open');
    searchPanelRef.current.setAttribute('aria-hidden', 'true');
    setIsPanelOpen(false);

    if (blur && searchInputRef.current) {
      searchInputRef.current.blur();
    }

    // Перерисовываем карту
    if (window.mapInstance) {
      window.mapInstance.resize();
    }
  }, [isPanelOpen]);

  const renderSearchResults = useCallback((searchQuery = '') => {
    if (!searchResultsRef.current || !searchEmptyRef.current) return;

    const normalized = searchQuery.trim().toLowerCase();
    searchResultsRef.current.innerHTML = '';

    if (!events.length) {
      if (searchEmptyRef.current) {
        searchEmptyRef.current.textContent = 'Данные загружаются…';
        searchEmptyRef.current.hidden = false;
      }
      return;
    }

    let matches;
    if (!normalized) {
      matches = events.slice(0, 6); // Показываем первые 6 событий как подсказки
      if (searchLabelRef.current) {
        searchLabelRef.current.textContent = 'Подсказки';
      }
    } else {
      // Генерируем все варианты транслитерации
      matches = searchEvents(events, normalized);
      matches = matches.slice(0, 20); // Ограничиваем

      if (searchLabelRef.current) {
        searchLabelRef.current.textContent = 'Результаты';
      }
    }

    if (!matches.length) {
      if (searchEmptyRef.current) {
        searchEmptyRef.current.textContent = 'Ничего не найдено';
        searchEmptyRef.current.hidden = false;
      }
      return;
    }

    searchEmptyRef.current.hidden = true;

    matches.forEach((event, index) => {
      const li = document.createElement('li');
      li.dataset.eventId = event.id;
      li.setAttribute('role', 'option');
      li.tabIndex = 0;
      li.innerHTML = `<strong>${event.title}</strong><span>${event.location}</span><span>${event.date}</span>`;

      li.addEventListener('click', () => {
        // Переход к событию
        const eventData = events.find(e => e.id === event.id);
        if (eventData && window.focusEvent) {
          window.focusEvent(eventData);
        }
        closeSearchPanel();
      });

      searchResultsRef.current.appendChild(li);
    });
  }, [events]);

  useEffect(() => {
    debounce(() => {
      renderSearchResults(query);
    }, 300)();
  }, [query, renderSearchResults]);

  // Обработчики
  const handleInputFocus = () => {
    openSearchPanel();
    toggleClearButton();
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    toggleClearButton();

    if (isPanelOpen) {
      renderSearchResults(e.target.value);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      closeSearchPanel();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const firstItem = searchResultsRef.current?.firstElementChild;
      if (firstItem) {
        firstItem.focus();
      }
    }
  };

  const toggleClearButton = () => {
    // Логика видимости кнопки очистки
  };

  const clearSearch = () => {
    setQuery('');
    searchInputRef.current?.focus();
    renderSearchResults('');
  };

  const handleHandleClick = () => {
    closeSearchPanel();
  };

  // Gesture handlers
  useEffect(() => {
    const panel = searchPanelRef.current;
    if (!panel) return;

    const handlePointerDown = (e) => {
      if (e.pointerType !== 'touch') {
        setDragStartY(null);
        return;
      }
      if (e.target.closest('#search-results')) {
        setDragStartY(null);
        return;
      }
      setDragStartY(e.clientY);
    };

    const handlePointerMove = (e) => {
      if (dragStartY === null || e.pointerType !== 'touch') return;
      const delta = e.clientY - dragStartY;
      if (delta > 80) {
        setDragStartY(null);
        closeSearchPanel();
      }
    };

    panel.addEventListener('pointerdown', handlePointerDown);
    panel.addEventListener('pointermove', handlePointerMove);

    return () => {
      panel.removeEventListener('pointerdown', handlePointerDown);
      panel.removeEventListener('pointermove', handlePointerMove);
    };
  }, [dragStartY, closeSearchPanel]);

  // Document handlers
  useEffect(() => {
    const handleDocumentPointerDown = (e) => {
      if (!isPanelOpen) return;
      if (searchPanelRef.current?.contains(e.target) || document.getElementById('bottomBar')?.contains(e.target)) {
        return;
      }
      closeSearchPanel();
    };

    const handleDocumentKeyDown = (e) => {
      if (e.key === 'Escape' && isPanelOpen) {
        closeSearchPanel();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', handleDocumentPointerDown);
    document.addEventListener('keydown', handleDocumentKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handleDocumentPointerDown);
      document.removeEventListener('keydown', handleDocumentKeyDown);
    };
  }, [isPanelOpen, closeSearchPanel]);

  return (
    <>
      {/* Нижняя панель поиска */}
      <div id="bottomBar" role="search">
        <div className="bottom-bar__inner">
          <div className="search-field">
            <span className="search-field__icon" aria-hidden="true">🔍</span>
            <input
              ref={searchInputRef}
              type="search"
              id="global-search"
              placeholder="Поиск событий и мест"
              autoComplete="off"
              value={query}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onKeyDown={handleKeyDown}
              enterKeyHint="search"
              aria-label="Поиск событий и мест"
            />
            <button
              type="button"
              id="search-clear"
              className={query ? 'is-visible' : ''}
              onClick={clearSearch}
              aria-label="Очистить поиск"
            >
              ×
            </button>
          </div>
        </div>
      </div>

      {/* Панель результатов */}
      <section
        ref={searchPanelRef}
        id="search-panel"
        aria-hidden={!isPanelOpen}
        role="dialog"
        aria-label="Результаты поиска"
      >
        <div className="search-panel__handle" aria-hidden="true" onClick={handleHandleClick}></div>
        <p ref={searchLabelRef} id="search-label" className="search-panel__label">Подказки</p>
        <ul ref={searchResultsRef} id="search-results" role="listbox" aria-label="Результаты поиска"></ul>
        <p ref={searchEmptyRef} id="search-empty" className="search-panel__empty">Загрузка данных…</p>
      </section>
    </>
  );
}

export default SearchPanel;
