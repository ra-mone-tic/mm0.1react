# Meow Map 🗺️

Интерактивная карта концертов и мероприятий на React. Полностью переписано из оригинального проекта mm0.1 с использованием современных технологий.

🚀 **Live demo**: [GitHub Pages](https://ra-mone-tic.github.io/meow-_-map/)

## Особенности

- ⚛️ React + TypeScript архитектура
- 🗺️ MapLibre GL для отображения карты
- 🎨 Темы: минimal, dark, colorful, monochrome
- 🔍 Умный поиск событий
- 📱 Адаптивный дизайн для мобильных
- 🤖 Автообновление событий из VK
- 🌐 GitHub Pages deployment

## Запуск локально

```bash
# Клонировать репозиторий
git clone https://github.com/ra-mone-tic/meow-_-map.git
cd meow-_-map

# Установить зависимости React
npm install

# Запустить dev server
npm start
# Откроется http://localhost:3000
```

## Структура проекта

```
src/
├── components/        # React компоненты
│   ├── Header.jsx     # Заголовок с темами и датами
│   ├── MapContainer.jsx # Карта с маркерами
│   ├── SearchPanel.jsx   # Панель поиска
│   └── Sidebar.jsx      # Список событий
├── utils/             # Утилиты
│   ├── map.js         # Логика карты и маркеров
│   ├── search.js      # Поиск по событиям
│   └── time.js        # Работа с датами
└── hooks/             # React хуки
    └── useEvents.js   # Загрузка данных событий

public/
├── events.json        # События (автообновляется)
├── geocode_cache.json # Кэш координат
└── index.html         # HTML с функция copyShareLink
```

## Автообновление данных

Система автоматически актуализирует события из VK паблика **meowafisha** каждые 2 часа через GitHub Actions.

### Настройка секретов в GitHub

Для работы автообновления нужно добавить секреты в Settings > Secrets and variables > Actions:

- `VK_TOKEN` - токен VK API (с правами wall)
- `YANDEX_KEY` - ключ Яндекс.Геокодера (опционально)
- `NOMINATIM_USER_AGENT` - идентификатор для Nominatim (опционально)

## Ручное обновление

Если нужно обновить события вручную:

```bash
# Установить Py dependencies
pip install -r requirements.txt

# Запустить скрипт
python fetch_events.py
```

## Deploy на GitHub Pages

Автоматически деплойится при push в main:

```bash
git add .
git commit -m "Update"
git push origin main
```

Страницу нужно включить в Settings > Pages:
- Source: GitHub Actions
- Появится автоматически после первого deployment

## Технические детали

- **Pop-up логика**: expand/collapse с gesture support
- **Темы**: CSS переменные и data-theme attribute
- **Поиск**: транслитерация EN ⇄ RU
- **Кэширование**: координаты хранятся в geocode_cache.json
- **Responsive**: mobile-first подход

## Команды

```bash
npm start     # Development server
npm run build # Production build
npm test      # Unit tests (пока пустые)

python fetch_events.py # Обновление данных VK
```
