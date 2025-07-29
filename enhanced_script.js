// Enhanced MeowAfisha with AI Recommendations
const CONFIG = {
    MAP_STYLE: 'https://api.maptiler.com/maps/streets/style.json?key=get_your_own_OpIi9ZULNHzrESv6T2vL',
    KALININGRAD_CENTER: [20.4522, 54.7104],
    DEFAULT_ZOOM: 11,
    EVENTS_FILE: 'events.json'
};

// Application state
const state = {
    map: null,
    events: [],
    filteredEvents: [],
    selectedDate: null,
    userPreferences: {
        likedEvents: JSON.parse(localStorage.getItem('likedEvents') || '[]'),
        dislikedEvents: JSON.parse(localStorage.getItem('dislikedEvents') || '[]'),
        preferredCategories: JSON.parse(localStorage.getItem('preferredCategories') || '[]')
    },
    recommendations: []
};

// Utility functions
const utils = {
    formatDate: (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    },
    
    extractKeywords: (text) => {
        const stopWords = ['в', 'на', 'и', 'с', 'по', 'для', 'от', 'до', 'из', 'к', 'о', 'об'];
        const words = text.toLowerCase().match(/\b\w+\b/g) || [];
        return words.filter(word => word.length > 2 && !stopWords.includes(word));
    },
    
    classifyEventType: (title) => {
        const title_lower = title.toLowerCase();
        const eventTypes = {
            'music': ['party', 'концерт', 'музыка', 'dj', 'диджей', 'stereo', 'electronic'],
            'cultural': ['выставка', 'театр', 'лекция', 'фестиваль'],
            'sports': ['спорт', 'футбол', 'волейбол', 'бег'],
            'food': ['пикник', 'food', 'еда'],
            'birthday': ['bday', 'birthday', 'день рождения']
        };
        
        for (const [type, keywords] of Object.entries(eventTypes)) {
            if (keywords.some(keyword => title_lower.includes(keyword))) {
                return type;
            }
        }
        return 'other';
    },
    
    classifyVenue: (location) => {
        const location_lower = location.toLowerCase();
        const venueTypes = {
            'club': ['клуб', 'club', 'место силы', 'barn'],
            'outdoor': ['пляж', 'парк', 'площадь', 'улица'],
            'cultural': ['театр', 'музей', 'галерея', 'дом культуры'],
            'bar_restaurant': ['бар', 'ресторан', 'кафе'],
            'educational': ['университет', 'кгту', 'институт']
        };
        
        for (const [type, keywords] of Object.entries(venueTypes)) {
            if (keywords.some(keyword => location_lower.includes(keyword))) {
                return type;
            }
        }
        return 'other';
    }
};

// AI Recommendation System (simplified client-side version)
const aiRecommendations = {
    calculateEventScore: (event, userPreferences) => {
        let score = 0;
        
        // Extract event features
        const keywords = utils.extractKeywords(event.title);
        const eventType = utils.classifyEventType(event.title);
        const venueType = utils.classifyVenue(event.location);
        
        // Check if user has preferences
        if (userPreferences.likedEvents.length === 0) {
            return 0.5; // Neutral score for new users
        }
        
        // Calculate keyword similarity with liked events
        const likedEvents = state.events.filter(e => userPreferences.likedEvents.includes(e.title));
        const likedKeywords = likedEvents.flatMap(e => utils.extractKeywords(e.title));
        const keywordMatches = keywords.filter(k => likedKeywords.includes(k)).length;
        const keywordScore = keywordMatches / Math.max(keywords.length, 1);
        
        // Event type preference
        const likedEventTypes = likedEvents.map(e => utils.classifyEventType(e.title));
        const eventTypeScore = likedEventTypes.includes(eventType) ? 1 : 0;
        
        // Venue type preference
        const likedVenueTypes = likedEvents.map(e => utils.classifyVenue(e.location));
        const venueScore = likedVenueTypes.includes(venueType) ? 1 : 0;
        
        // Time preference (weekend bonus)
        const eventDate = new Date(event.date);
        const weekendBonus = eventDate.getDay() >= 5 ? 0.2 : 0;
        
        // Combine scores
        score = keywordScore * 0.4 + eventTypeScore * 0.3 + venueScore * 0.2 + weekendBonus;
        
        // Penalty for disliked events
        if (userPreferences.dislikedEvents.includes(event.title)) {
            score *= 0.1;
        }
        
        return score;
    },
    
    getRecommendations: (events, userPreferences, limit = 10) => {
        const scoredEvents = events.map(event => ({
            ...event,
            score: aiRecommendations.calculateEventScore(event, userPreferences)
        }));
        
        return scoredEvents
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    },
    
    getPopularEvents: (events, limit = 10) => {
        const popularVenues = ['место силы', 'форма', 'barn'];
        const popularTypes = ['party', 'концерт', 'festival'];
        
        const scoredEvents = events.map(event => {
            let score = 0;
            const titleLower = event.title.toLowerCase();
            const locationLower = event.location.toLowerCase();
            
            // Venue popularity
            if (popularVenues.some(venue => locationLower.includes(venue))) {
                score += 2;
            }
            
            // Event type popularity
            if (popularTypes.some(type => titleLower.includes(type))) {
                score += 1;
            }
            
            // Weekend bonus
            const eventDate = new Date(event.date);
            if (eventDate.getDay() >= 5) {
                score += 1;
            }
            
            return { ...event, popularityScore: score };
        });
        
        return scoredEvents
            .sort((a, b) => b.popularityScore - a.popularityScore)
            .slice(0, limit);
    }
};

// Map management
const mapManager = {
    init: () => {
        state.map = new maplibregl.Map({
            container: 'map',
            style: CONFIG.MAP_STYLE,
            center: CONFIG.KALININGRAD_CENTER,
            zoom: CONFIG.DEFAULT_ZOOM
        });
        
        state.map.addControl(new maplibregl.NavigationControl());
        state.map.addControl(new maplibregl.GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: true
        }));
    },
    
    addMarkers: (events) => {
        // Clear existing markers
        const existingMarkers = document.querySelectorAll('.maplibregl-marker');
        existingMarkers.forEach(marker => marker.remove());
        
        events.forEach(event => {
            if (event.lat && event.lon) {
                const el = document.createElement('div');
                el.className = 'marker';
                el.style.backgroundImage = 'url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDOC4xMyAyIDUgNS4xMyA1IDlDNSAxNC4yNSAxMiAyMiAxMiAyMkMxMiAyMiAxOSAxNC4yNSAxOSA5QzE5IDUuMTMgMTUuODcgMiAxMiAyWk0xMiAxMS41QzEwLjYyIDExLjUgOS41IDEwLjM4IDkuNSA5QzkuNSA3LjYyIDEwLjYyIDYuNSAxMiA2LjVDMTMuMzggNi41IDE0LjUgNy42MiAxNC41IDlDMTQuNSAxMC4zOCAxMy4zOCAxMS41IDEyIDExLjVaIiBmaWxsPSIjRkY2NjAwIi8+Cjwvc3ZnPgo=)';
                el.style.width = '24px';
                el.style.height = '24px';
                el.style.backgroundSize = 'contain';
                el.style.cursor = 'pointer';
                
                const popup = new maplibregl.Popup({ offset: 25 })
                    .setHTML(`
                        <div class="popup-content">
                            <h3>${event.title}</h3>
                            <p><strong>📍</strong> ${event.location}</p>
                            <p><strong>📅</strong> ${utils.formatDate(event.date)}</p>
                            <div class="popup-actions">
                                <button onclick="userInteraction.likeEvent('${event.title}')" class="btn-like">👍</button>
                                <button onclick="userInteraction.dislikeEvent('${event.title}')" class="btn-dislike">👎</button>
                            </div>
                        </div>
                    `);
                
                new maplibregl.Marker(el)
                    .setLngLat([event.lon, event.lat])
                    .setPopup(popup)
                    .addTo(state.map);
            }
        });
    }
};

// Event rendering
const eventRenderer = {
    renderEventsList: (events, containerId = 'events-list') => {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        if (events.length === 0) {
            container.innerHTML = '<p class="no-events">Нет событий для отображения</p>';
            return;
        }
        
        container.innerHTML = events.map(event => `
            <div class="event-item" data-event-title="${event.title}">
                <div class="event-content">
                    <h3 class="event-title">${event.title}</h3>
                    <p class="event-location">📍 ${event.location}</p>
                    <p class="event-date">📅 ${utils.formatDate(event.date)}</p>
                    ${event.score ? `<p class="event-score">🎯 Рекомендация: ${(event.score * 100).toFixed(0)}%</p>` : ''}
                    ${event.popularityScore ? `<p class="event-popularity">🔥 Популярность: ${event.popularityScore}</p>` : ''}
                </div>
                <div class="event-actions">
                    <button onclick="userInteraction.likeEvent('${event.title}')" class="btn-like" title="Нравится">👍</button>
                    <button onclick="userInteraction.dislikeEvent('${event.title}')" class="btn-dislike" title="Не нравится">👎</button>
                    <button onclick="mapManager.focusOnEvent(${event.lat}, ${event.lon})" class="btn-locate" title="Показать на карте">📍</button>
                </div>
            </div>
        `).join('');
    },
    
    renderRecommendations: () => {
        const recommendations = aiRecommendations.getRecommendations(
            state.filteredEvents, 
            state.userPreferences, 
            5
        );
        
        const container = document.getElementById('recommendations');
        if (!container) return;
        
        if (recommendations.length === 0 || state.userPreferences.likedEvents.length === 0) {
            container.innerHTML = `
                <h3>🤖 Персональные рекомендации</h3>
                <p class="no-recommendations">Поставьте лайки событиям, чтобы получить персональные рекомендации!</p>
            `;
            return;
        }
        
        container.innerHTML = `
            <h3>🤖 Рекомендуем для вас</h3>
            <div class="recommendations-list">
                ${recommendations.map(event => `
                    <div class="recommendation-item">
                        <h4>${event.title}</h4>
                        <p>📍 ${event.location}</p>
                        <p>📅 ${utils.formatDate(event.date)}</p>
                        <div class="recommendation-score">
                            <span class="score-bar" style="width: ${event.score * 100}%"></span>
                            <span class="score-text">${(event.score * 100).toFixed(0)}% совпадение</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },
    
    renderPopularEvents: () => {
        const popularEvents = aiRecommendations.getPopularEvents(state.filteredEvents, 5);
        
        const container = document.getElementById('popular-events');
        if (!container) return;
        
        container.innerHTML = `
            <h3>🔥 Популярные события</h3>
            <div class="popular-list">
                ${popularEvents.map(event => `
                    <div class="popular-item">
                        <h4>${event.title}</h4>
                        <p>📍 ${event.location}</p>
                        <p>📅 ${utils.formatDate(event.date)}</p>
                        <div class="popularity-indicator">
                            ${'⭐'.repeat(Math.min(event.popularityScore, 5))}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
};

// User interaction handling
const userInteraction = {
    likeEvent: (eventTitle) => {
        if (!state.userPreferences.likedEvents.includes(eventTitle)) {
            state.userPreferences.likedEvents.push(eventTitle);
            // Remove from disliked if present
            state.userPreferences.dislikedEvents = state.userPreferences.dislikedEvents.filter(title => title !== eventTitle);
            userInteraction.savePreferences();
            userInteraction.updateUI();
        }
    },
    
    dislikeEvent: (eventTitle) => {
        if (!state.userPreferences.dislikedEvents.includes(eventTitle)) {
            state.userPreferences.dislikedEvents.push(eventTitle);
            // Remove from liked if present
            state.userPreferences.likedEvents = state.userPreferences.likedEvents.filter(title => title !== eventTitle);
            userInteraction.savePreferences();
            userInteraction.updateUI();
        }
    },
    
    savePreferences: () => {
        localStorage.setItem('likedEvents', JSON.stringify(state.userPreferences.likedEvents));
        localStorage.setItem('dislikedEvents', JSON.stringify(state.userPreferences.dislikedEvents));
        localStorage.setItem('preferredCategories', JSON.stringify(state.userPreferences.preferredCategories));
    },
    
    updateUI: () => {
        eventRenderer.renderRecommendations();
        eventRenderer.renderPopularEvents();
        // Update visual indicators for liked/disliked events
        document.querySelectorAll('.event-item').forEach(item => {
            const eventTitle = item.dataset.eventTitle;
            const likeBtn = item.querySelector('.btn-like');
            const dislikeBtn = item.querySelector('.btn-dislike');
            
            if (state.userPreferences.likedEvents.includes(eventTitle)) {
                likeBtn.classList.add('active');
                dislikeBtn.classList.remove('active');
            } else if (state.userPreferences.dislikedEvents.includes(eventTitle)) {
                dislikeBtn.classList.add('active');
                likeBtn.classList.remove('active');
            } else {
                likeBtn.classList.remove('active');
                dislikeBtn.classList.remove('active');
            }
        });
    }
};

// UI management
const uiManager = {
    init: () => {
        const dateInput = document.getElementById('date-filter');
        if (dateInput) {
            dateInput.addEventListener('change', uiManager.handleDateFilter);
            // Set default date to today
            dateInput.value = new Date().toISOString().split('T')[0];
        }
        
        // Add toggle for sidebar
        const toggleBtn = document.querySelector('.sidebar-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', uiManager.toggleSidebar);
        }
    },
    
    handleDateFilter: (event) => {
        state.selectedDate = event.target.value;
        uiManager.filterEvents();
    },
    
    filterEvents: () => {
        let filtered = [...state.events];
        
        if (state.selectedDate) {
            const selectedDate = new Date(state.selectedDate);
            filtered = filtered.filter(event => {
                const eventDate = new Date(event.date);
                return eventDate >= selectedDate;
            });
        }
        
        state.filteredEvents = filtered;
        eventRenderer.renderEventsList(filtered);
        eventRenderer.renderRecommendations();
        eventRenderer.renderPopularEvents();
        mapManager.addMarkers(filtered);
        userInteraction.updateUI();
    },
    
    toggleSidebar: () => {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.toggle('collapsed');
        }
    }
};

// Data loading
const dataLoader = {
    loadEvents: async () => {
        try {
            const response = await fetch(CONFIG.EVENTS_FILE);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const events = await response.json();
            
            // Filter out events with invalid dates
            const validEvents = events.filter(event => {
                const date = new Date(event.date);
                return !isNaN(date.getTime()) && event.lat && event.lon;
            });
            
            state.events = validEvents;
            state.filteredEvents = validEvents;
            
            console.log(`Loaded ${validEvents.length} valid events`);
            
            eventRenderer.renderEventsList(validEvents);
            eventRenderer.renderRecommendations();
            eventRenderer.renderPopularEvents();
            mapManager.addMarkers(validEvents);
            userInteraction.updateUI();
            
        } catch (error) {
            console.error('Error loading events:', error);
            document.getElementById('events-list').innerHTML = 
                '<p class="error">Ошибка загрузки данных о событиях</p>';
        }
    }
};

// Add focus on event method to mapManager
mapManager.focusOnEvent = (lat, lon) => {
    if (state.map && lat && lon) {
        state.map.flyTo({
            center: [lon, lat],
            zoom: 15,
            duration: 1000
        });
    }
};

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    mapManager.init();
    uiManager.init();
    dataLoader.loadEvents();
});

// Make functions globally available
window.userInteraction = userInteraction;
window.mapManager = mapManager;

