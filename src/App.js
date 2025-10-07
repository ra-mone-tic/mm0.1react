import { useState, useEffect } from 'react';
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

  // Устанавливаем глобальную функцию для поиска
  useEffect(() => {
    window.focusEvent = (event) => {
      handleEventSelect(event);
    };
  }, []);



  // Закрытие панелей при клике вне
  const handleLayoutClick = (e) => {
    // Закрываем сайдбар при клике вне
    if (showSidebar && !e.target.closest('.sidebar') && !e.target.closest('#burger')) {
      setShowSidebar(false);
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
