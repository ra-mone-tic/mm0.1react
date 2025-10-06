import { useState, useEffect } from 'react';

function Header({ selectedDate, onDateChange, onToggleSidebar }) {
  const themes = ['minimal', 'dark', 'colorful', 'monochrome'];
  const [themeIndex, setThemeIndex] = useState(0);

  const theme = themes[themeIndex];

  useEffect(() => {
    // Установить тему при первой загрузке
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleLogoClick = () => {
    const newIndex = (themeIndex + 1) % themes.length;
    setThemeIndex(newIndex);
  };

  return (
    <header className="app-header">
      <label htmlFor="event-date">
        <span aria-hidden="true">📅</span> Дата:
      </label>
      <input
        type="date"
        id="event-date"
        value={selectedDate}
        onChange={(e) => onDateChange(e.target.value)}
      />
      <img
        id="logo"
        src="https://thumbs.dreamstime.com/b/cat-builder-holding-drill-white-background-cat-builder-drill-123551503.jpg"
        alt="Meow Records"
        onClick={handleLogoClick}
      />
      <button
        id="burger"
        aria-label="Открыть список событий"
        role="button"
        tabIndex={0}
        onClick={onToggleSidebar}
      >
        ☰
      </button>
    </header>
  );
}

export default Header;
