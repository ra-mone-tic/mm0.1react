import { useState } from 'react';
import EventList from './EventList';

function Sidebar({
  events,
  isOpen,
  selectedDate,
  onDateChange,
  onEventClick,
  loading
}) {
  const [showingArchive, setShowingArchive] = useState(false);

  const upcomingEvents = events.filter(event => {
    const DEVICE_TODAY = new Date().toISOString().slice(0, 10);
    if (event.date > DEVICE_TODAY) return true;
    if (event.date < DEVICE_TODAY) return false;

    // Для сегодняшних проверяем время
    if (!event.text) return true;
    const { extractTimeFromText } = require('../utils/time.js');
    const timeInfo = extractTimeFromText(event.text);
    if (!timeInfo || !timeInfo.hasEndTime) return true;

    const endTime = new Date(event.date + 'T' + timeInfo.end + ':00');
    return endTime > new Date(); // Показываем если не закончилось
  });

  const archiveEvents = events.filter(event => {
    const DEVICE_TODAY = new Date().toISOString().slice(0, 10);
    if (event.date > DEVICE_TODAY) return false;
    if (event.date < DEVICE_TODAY) return true;

    if (!event.text) return false;
    const { extractTimeFromText } = require('../utils/time.js');
    const timeInfo = extractTimeFromText(event.text);
    if (!timeInfo || !timeInfo.hasEndTime) return false;

    const endTime = new Date(event.date + 'T' + timeInfo.end + ':00');
    return endTime <= new Date(); // В архив если закончилось
  });

  const displayedEvents = showingArchive ? archiveEvents : upcomingEvents;

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`} aria-label="Список событий">
      <div className="sidebar-header">
        <h2>События</h2>
      </div>
      <div className="sidebar-content">
        {loading ? (
          <div className="loading">Загрузка событий...</div>
        ) : (
          <EventList
            events={displayedEvents}
            selectedDate={selectedDate}
            onEventClick={onEventClick}
            showingArchive={showingArchive}
          />
        )}
      </div>
      <div className="sidebar-footer">
        <button
          type="button"
          onClick={() => setShowingArchive(!showingArchive)}
        >
          {showingArchive ? 'Назад' : 'Архив'}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
