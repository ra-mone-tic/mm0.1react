import { useState, useEffect } from 'react';
import { loadGeocodeCache, updateEventCoordinates, makeEventId } from '../utils/map.js';
import { JSON_URL } from '../config.js';
import { formatLocation, getDayOfWeekName } from '../utils/time.js';

// Хук для управления данными событий
export function useEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadEvents = async () => {
    try {
      setLoading(true);

      // Загружаем кэш сначала
      await loadGeocodeCache();

      // Загружаем события
      const response = await fetch(JSON_URL);
      if (!response.ok) {
        throw new Error(`Ошибка загрузки: ${response.status}`);
      }

      const rawEvents = await response.json();

      // Обрабатываем события
      const processedEvents = rawEvents
        .map(event => ({
          ...event,
          location: formatLocation(event.location), // Очищаем локацию
          id: makeEventId(event) // Генерируем уникальный ID
        }))
        .map(updateEventCoordinates) // Обновляем координаты из кэша
        .sort((a, b) => a.date.localeCompare(b.date)); // Сортируем по дате

      setEvents(processedEvents);
      return processedEvents;
    } catch (err) {
      console.error('Ошибка в загрузке событий:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Загружаем данные при монтировании
  useEffect(() => {
    loadEvents();
  }, []);

  return {
    events,
    loading,
    error,
    reload: loadEvents
  };
}

// Хук для фильтрации событий по дате (предстоящие/архив)
export function useEventGroups(events) {
  const [showingArchive, setShowingArchive] = useState(false);

  const DEVICE_TODAY = new Date().toISOString().slice(0, 10);

  const upcomingEvents = events.filter(event => {
    if (event.date > DEVICE_TODAY) return true;
    if (event.date < DEVICE_TODAY) return false;

    // Для сегодняшних проверяем время окончания
    if (!event.text) return true;

    const { extractTimeFromText } = require('../utils/time.js');
    const timeInfo = extractTimeFromText(event.text);
    if (!timeInfo || !timeInfo.hasEndTime) return true;

    const timeAgo = getTimeAgoForEvent(event.date, timeInfo.end, timeInfo.start);
    return !timeAgo; // Если время не прошло, в upcoming
  });

  const archiveEvents = events.filter(event => {
    if (event.date > DEVICE_TODAY) return false;
    if (event.date < DEVICE_TODAY) return true;

    if (!event.text) return false;

    const { extractTimeFromText } = require('../utils/time.js');
    const timeInfo = extractTimeFromText(event.text);
    if (!timeInfo || !timeInfo.hasEndTime) return false;

    const timeAgo = getTimeAgoForEvent(event.date, timeInfo.end, timeInfo.start);
    return !!timeAgo; // Если время прошло, в archive
  });

  // Группировка upcoming событий по дням
  const groupedUpcoming = showingArchive ? {} : groupEventsByDate(upcomingEvents, DEVICE_TODAY);

  return {
    showingArchive,
    setShowingArchive,
    upcomingEvents,
    archiveEvents,
    groupedEvents: groupedUpcoming
  };
}

// Вспомогательная функция для проверки, прошло ли время события
function getTimeAgoForEvent(eventDateStr, endTimeStr, startTimeStr) {
  if (!endTimeStr || !eventDateStr) return false;

  let endDateStr = eventDateStr;
  const startHour = startTimeStr ? parseInt(startTimeStr.split(':')[0]) : 0;
  const endHour = parseInt(endTimeStr.split(':')[0]);

  if (endHour < startHour) {
    const date = new Date(eventDateStr);
    date.setDate(date.getDate() + 1);
    endDateStr = date.toISOString().slice(0, 10);
  }

  const endTime = new Date(endDateStr + 'T' + endTimeStr + ':00');
  const now = new Date();

  return endTime <= now;
}

// Экспортируем groupEventsByDate для использования в компонентах
export function groupEventsByDate(events, todayStr) {
  const grouped = {};
  const today = new Date();

  events.forEach(event => {
    let header = '';
    const eventDay = new Date(event.date + 'T00:00:00');
    const eventIndex = eventDay.getDay();

    if (event.date === todayStr) {
      header = 'Сегодня';
    } else {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().slice(0, 10);

      if (event.date === tomorrowStr) {
        header = 'Завтра';
      } else {
        // Дни недели
        header = getDayOfWeekName(eventIndex);
      }
    }

    if (!grouped[header]) {
      grouped[header] = [];
    }
    grouped[header].push(event);
  });

  return grouped;
}
