import { generateTransliterations } from './translit.js';

export function searchEvents(events, query) {
  if (!query || !events.length) return events.slice(0, 6);

  const normalized = query.trim().toLowerCase();
  const variants = generateTransliterations(normalized);

  return events.filter(event => {
    const eventText = `${event.title} ${event.location}`.toLowerCase();
    return variants.some(variant => eventText.includes(variant));
  }).slice(0, 20); // Ограничение результатов
}
