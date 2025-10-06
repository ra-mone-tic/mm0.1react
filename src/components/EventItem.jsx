import { getEventDateLabel } from '../utils/time.js';

function EventItem({ event, onClick, showTimeAgo = false, isActive = false }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.(event);
    }
  };

  return (
    <div
      className={`event-item ${isActive ? 'is-active' : ''}`}
      role="button"
      tabIndex={0}
      onClick={() => onClick?.(event)}
      onKeyDown={handleKeyDown}
    >
      <strong>{event.title}</strong><br />
      {event.location}<br />
      <em dangerouslySetInnerHTML={{
        __html: getEventDateLabel(event.date, event.text, showTimeAgo)
      }} />
    </div>
  );
}

export default EventItem;
