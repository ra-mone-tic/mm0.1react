import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import MapContainer from './components/MapContainer';
import Sidebar from './components/Sidebar';
import SearchPanel from './components/SearchPanel';
import { useEvents } from './hooks/useEvents.js';
import './App.css';

function App() {
  const { events, loading } = useEvents();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showSearchPanel, setShowSearchPanel] = useState(false);

  const handleEventSelect = (event) => {
    setSelectedEvent(event);
    setShowSidebar(false); // Закрыть сайдбар при выборе
  };

  // Функция для фокуса события (для поиска)
  const focusEvent = (event) => {
    handleEventSelect(event);
  };

  // Устанавливаем глобальную функцию для поиска
  useEffect(() => {
    window.focusEvent = focusEvent;
  }, [focusEvent]);



  // Закрытие панелей при клике вне
  const handleLayoutClick = (e) => {
    if (showSidebar && !e.target.closest('.sidebar') && !e.target.closest('#burger') && !e.target.closest('#event-date')) {
      setShowSidebar(false);
    }
    // Для поиска - закрываем только при клике вне всей области поиска
    if (showSearchPanel && !e.target.closest('.layout') && !e.target.closest('.bottom-bar') && !e.target.closest('#search-panel')) {
      setShowSearchPanel(false);
    }
  };

  return (
    <div className="app" onClick={handleLayoutClick}>
      <Header
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onToggleSidebar={() => setShowSidebar(!showSidebar)}
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
          onDateChange={setSelectedDate}
          onEventClick={handleEventSelect}
          loading={loading}
        />
      </div>
      <SearchPanel events={events} />
    </div>
  );
}

export default App;
