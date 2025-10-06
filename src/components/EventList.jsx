import { useMemo } from 'react';
import SectionHeader from './SectionHeader';
import EventItem from './EventItem';
import { groupEventsByDate } from '../hooks/useEvents.js';
import { DEVICE_TODAY } from '../config.js';

function EventList({ events, selectedDate, onEventClick, showingArchive = false }) {
  const groupedEvents = useMemo(() => {
    if (showingArchive) {
      return events.sort((a, b) => b.date.localeCompare(a.date));
    }

    const upcomingEvents = events.filter(event => {
      if (event.date > DEVICE_TODAY) return true;
      if (event.date < DEVICE_TODAY) return false;

      // Filter сегодняшний день: только события, которые ещё не закончились
      const extractTimeFromText = require('../utils/time.js').extractTimeFromText;
      const timeInfo = event.text ? extractTimeFromText(event.text) : null;
      if (!timeInfo || !timeInfo.hasEndTime) return true;

      const getTimeAgoForEvent = require('../hooks/useEvents.js').getTimeAgoForEvent;
      return !getTimeAgoForEvent(event.date, timeInfo.end, timeInfo.start);
    });

    return groupEventsByDate(upcomingEvents, DEVICE_TODAY);
  }, [events, showingArchive, selectedDate]);

  if (!events.length) {
    return (
      <div className="event-list-empty">
        {showingArchive ? 'Архив пуст' : 'Нет предстоящих событий'}
      </div>
    );
  }

  if (showingArchive) {
    return (
      <div className="event-list">
        {groupedEvents.map(event => (
          <EventItem
            key={event.id}
            event={event}
            onClick={onEventClick}
          />
        ))}
      </div>
    );
  }

  // Upcoming events with section headers
  const sections = Object.entries(groupedEvents);

  return (
    <div className="event-list">
      {sections.map(([sectionLabel, eventsInSection]) => (
        <div key={sectionLabel}>
          <SectionHeader
            title={sectionLabel}
            isToday={sectionLabel === 'Сегодня'}
            isTomorrow={sectionLabel === 'Завтра'}
          />
          {eventsInSection.map(event => (
            <EventItem
              key={event.id}
              event={event}
              onClick={onEventClick}
              showTimeAgo={sectionLabel === 'Сегодня'}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default EventList;
