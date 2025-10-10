import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import MapContainer from './components/MapContainer';
import Sidebar from './components/Sidebar';
import SearchPanel from './components/SearchPanel';

import { useEvents } from './hooks/useEvents.js';
import { getMarkerById } from './utils/map.js';
import './App.css';

function App() {
  const { events, loading } = useEvents();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const handleEventSelect = useCallback((event) => {
    if (event.date !== selectedDate) {
      setSelectedDate(event.date);
    }
    setSelectedEvent(event);
    setShowSidebar(false); // Закрыть сайдбар при выборе
  }, [selectedDate]);

  const handleToggleSidebar = useCallback(() => {
    setShowSidebar(prev => !prev);
  }, []);

  // Устанавливаем глобальную функцию для поиска
  useEffect(() => {
    window.focusEvent = (event) => {
      handleEventSelect(event);
    };
  }, [handleEventSelect]);



  // Закрытие панелей при клике вне
  const handleLayoutClick = useCallback((e) => {
    // Закрываем сайдбар при клике вне
    if (showSidebar && !e.target.closest('.sidebar') && !e.target.closest('#burger')) {
      setShowSidebar(false);
    }
  }, [showSidebar]);

  return (
    <div className="app" onClick={handleLayoutClick}>
      <Header
        selectedDate={selectedDate}
        onDateChange={(date) => { setSelectedDate(date); setSelectedEvent(null); }}
        onToggleSidebar={handleToggleSidebar}
      />
      <div className="layout">
        <MapContainer
          events={events}
          selectedDate={selectedDate}
          selectedEvent={selectedEvent}
          onEventSelect={handleEventSelect}
        />
        <Sidebar
          events={events}
          isOpen={showSidebar}
          selectedDate={selectedDate}
          onDateChange={(date) => { setSelectedDate(date); setSelectedEvent(null); }}
          onEventClick={handleEventSelect}
          loading={loading}
        />
      </div>
      <SearchPanel events={events} />
    </div>
  );
}

export default App;
