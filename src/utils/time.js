import { DEVICE_TODAY } from '../config';

// Функции для работы со временем и датами

export function extractTimeFromText(text) {
  if (!text) return null;

  // Ищем время в форматах: "18:00", "18:00-22:00"
  // Используем более строгие паттерны, чтобы не путать с датами dd.mm
  const timePatterns = [
    /(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/,  // 18:00 - 22:00 (только с двоеточием)
    /(\d{1,2}):(\d{2})/   // 18:00 (только с двоеточием)
  ];

  for (const pattern of timePatterns) {
    const match = text.match(pattern);
    if (match) {
      if (match.length === 5) {
        // Формат с диапазоном времени
        const startHour = parseInt(match[1]);
        const startMin = parseInt(match[2]);
        const endHour = parseInt(match[3]);
        const endMin = parseInt(match[4]);

        // Проверяем, что это действительно время, а не дата
        // Часы должны быть 00-23, минуты 00-59
        if (startHour >= 0 && startHour <= 23 &&
            startMin >= 0 && startMin <= 59 &&
            endHour >= 0 && endHour <= 23 &&
            endMin >= 0 && endMin <= 59) {
          return {
            full: `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}-${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`,
            start: `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`,
            end: `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`,
            hasEndTime: true
          };
        }
      } else if (match.length === 3) {
        // Формат с одним временем
        const hour = parseInt(match[1]);
        const min = parseInt(match[2]);

        // Проверяем, что это действительно время, а не дата
        // Часы должны быть 00-23, минуты 00-59
        if (hour >= 0 && hour <= 23 && min >= 0 && min <= 59) {
          return {
            full: `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`,
            start: `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`,
            end: null,
            hasEndTime: false
          };
        }
      }
    }
  }

  return null;
}

export function getEventDateLabel(dateStr, eventText = null, showTimeAgo = false) {
  const timeStr = eventText ? extractTimeFromText(eventText) : null;

  if (dateStr === DEVICE_TODAY) {
    let result = '<span style="font-weight: bold; font-style: italic;">Сегодня</span>';

    if (timeStr) {
      result += ` <span style="font-style: italic;">${timeStr.full}</span>`;
    }

    // Если нужно показать "Закончилось n часов назад"
    if (showTimeAgo && timeStr && timeStr.hasEndTime) {
      const timeAgoText = getTimeAgoText(dateStr, timeStr.end, timeStr.start);
      if (timeAgoText) {
        result += `<br><span style="font-size: 11px; color: var(--text-2);">${timeAgoText}</span>`;
      }
    }

    return result;
  }
  if (!dateStr) return '';

  // Преобразуем yyyy-mm-dd в dd.mm.yy для единого формата
  const m = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    const day = parseInt(m[3]);
    const month = parseInt(m[2]);
    const year = m[1].slice(-2); // берем только последние 2 цифры года
    const formattedDate = `${day.toString().padStart(2, '0')}.${month.toString().padStart(2, '0')}.${year}`;

    let result = `<span style="font-weight: bold; font-style: italic;">${formattedDate}</span>`;

    if (timeStr) {
      result += ` <span style="font-style: italic;">${timeStr.full}</span>`;
    }

    // Если нужно показать "Закончилось n часов назад" для любого дня
    if (showTimeAgo && timeStr && timeStr.hasEndTime) {
      const timeAgoText = getTimeAgoText(dateStr, timeStr.end, timeStr.start);
      if (timeAgoText) {
        result += `<br><span style="font-size: 11px; color: var(--text-2);">${timeAgoText}</span>`;
      }
    }

    return result;
  }
  return `<span style="font-weight: bold; font-style: italic;">${dateStr}</span>`;
}

// Функция для получения названий дней недели на русском
export function getDayOfWeekName(dayIndex) {
  const daysOfWeek = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
  return daysOfWeek[dayIndex] || '';
}

// Функция для получения дня недели по дате
export function getDayOfWeekFromDate(dateStr) {
  if (!dateStr) return -1;
  const date = new Date(dateStr + 'T00:00:00');
  return date.getDay(); // 0 - воскресенье, 1 - понедельник, ..., 6 - суббота
}

// Функция для расчета времени окончания события с датой
export function getTimeAgoText(eventDateStr, endTimeStr, startTimeStr) {
  if (!endTimeStr || !eventDateStr) return '';

  // Рассчитываем точное время окончания с учётом даты и переноса через полночь
  let endDateStr = eventDateStr;
  const startHour = startTimeStr ? parseInt(startTimeStr.split(':')[0]) : 0;
  const endHour = parseInt(endTimeStr.split(':')[0]);
  if (endHour < startHour) {
    // Событие заканчивается на следующий день
    const date = new Date(eventDateStr);
    date.setDate(date.getDate() + 1);
    endDateStr = date.toISOString().slice(0, 10);
  }

  const endTime = new Date(endDateStr + 'T' + endTimeStr + ':00');
  const now = new Date();

  // Если событие ещё не закончилось, возвращаем пустую строку
  if (endTime > now) return '';

  const diffInMs = now - endTime;
  const hours = Math.ceil(diffInMs / (1000 * 60 * 60));

  if (hours === 1) return 'Закончилось 1 час назад';
  if (hours < 5) return `Закончилось ${hours} часа назад`;
  return `Закончилось ${hours} часов назад`;
}

// Функция для форматирования локации
export function formatLocation(location) {
  if (!location) return '';
  return location.replace(/,?\s*Калининград\s*$/i, '');
}

// Функция debounce для оптимизации
export function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
