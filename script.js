// Configuration
const CONFIG = {
  JSON_URL: 'events.json?v=20250730',
  MAPTILER_KEY: 'QAuK0LSzMpyDV8I7iX6a',
  KALININGRAD_CENTER: [20.45, 54.71],
  DEFAULT_ZOOM: 10,
  DETAIL_ZOOM: 14,
  MAX_UPCOMING_EVENTS: 100
};

// State management
const state = {
  map: null,
  markers: [],
  events: [],
  currentDate: null
};

// Utility functions
const utils = {
  formatDate: (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  },
  
  getTodayString: () => new Date().toISOString().slice(0, 10),
  
  findNearestMarker: (targetEvent) => {
    return state.markers.find(marker => {
      const pos = marker.getLngLat();
      return Math.abs(pos.lat - targetEvent.lat) < 1e-5 && 
             Math.abs(pos.lng - targetEvent.lon) < 1e-5;
    });
  }
};

// Map management
const mapManager = {
  init: () => {
    state.map = new maplibregl.Map({
      container: 'map',
      style: `https://api.maptiler.com/maps/basic/style.json?key=${CONFIG.MAPTILER_KEY}`,
      center: CONFIG.KALININGRAD_CENTER,
      zoom: CONFIG.DEFAULT_ZOOM
    });

    // Add controls
    state.map.addControl(new maplibregl.NavigationControl(), 'top-right');
    state.map.addControl(new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      showUserLocation: true
    }), 'top-right');

    // Optimize rendering
    state.map.on('load', () => {
      setTimeout(() => state.map.resize(), 100);
    });
  },

  clearMarkers: () => {
    state.markers.forEach(marker => marker.remove());
    state.markers = [];
  },

  addMarker: (event) => {
    const popup = new maplibregl.Popup({ offset: 25 })
      .setHTML(`
        <div class="popup-content">
          <h4>${event.title}</h4>
          <p><strong>📍 ${event.location}</strong></p>
          <p><strong>📅 ${utils.formatDate(event.date)}</strong></p>
        </div>
      `);

    const marker = new maplibregl.Marker()
      .setLngLat([event.lon, event.lat])
      .setPopup(popup)
      .addTo(state.map);

    state.markers.push(marker);
  },

  flyToEvent: (event) => {
    state.map.flyTo({
      center: [event.lon, event.lat],
      zoom: CONFIG.DETAIL_ZOOM
    });
  }
};

// Event rendering
const eventRenderer = {
  renderEventsForDate: (dateStr) => {
    mapManager.clearMarkers();
    const dayEvents = state.events.filter(event => event.date === dateStr);
    
    dayEvents.forEach(mapManager.addMarker);
    
    if (dayEvents.length > 0) {
      mapManager.flyToEvent(dayEvents[0]);
    }
    
    state.currentDate = dateStr;
  },

  renderUpcomingEvents: () => {
    const today = utils.getTodayString();
    const upcoming = state.events
      .filter(event => new Date(event.date) >= new Date(today))
      .slice(0, CONFIG.MAX_UPCOMING_EVENTS);

    const upcomingDiv = document.getElementById('upcoming');
    
    if (!upcoming.length) {
      upcomingDiv.innerHTML = '<p class="no-events">События не найдены</p>';
      return;
    }

    upcomingDiv.innerHTML = '';
    upcoming.forEach(event => {
      const eventElement = document.createElement('div');
      eventElement.className = 'item';
      eventElement.innerHTML = `
        <strong>${event.title}</strong><br>
        <span class="location">📍 ${event.location}</span><br>
        <i class="date">📅 ${utils.formatDate(event.date)}</i>
      `;
      
      eventElement.onclick = () => {
        eventRenderer.renderEventsForDate(event.date);
        
        setTimeout(() => {
          const marker = utils.findNearestMarker(event);
          if (marker) {
            mapManager.flyToEvent(event);
            marker.togglePopup();
          }
          uiManager.closeSidebar();
        }, 100);
      };
      
      upcomingDiv.appendChild(eventElement);
    });
  }
};

// UI management
const uiManager = {
  setupDateInput: () => {
    const input = document.getElementById('event-date');
    if (state.events.length === 0) return;

    input.min = state.events[0].date;
    input.max = state.events[state.events.length - 1].date;
    
    const today = utils.getTodayString();
    const firstAvailableDate = state.events.find(e => e.date >= today) ? today : state.events[0].date;
    
    input.value = firstAvailableDate;
    eventRenderer.renderEventsForDate(firstAvailableDate);
    
    input.onchange = (e) => {
      const selectedDate = new Date(e.target.value).toISOString().slice(0, 10);
      eventRenderer.renderEventsForDate(selectedDate);
    };
  },

  setupSidebarControls: () => {
    document.getElementById('burger').onclick = () => {
      document.getElementById('sidebar').classList.toggle('open');
    };
    
    document.getElementById('closeSidebar').onclick = () => {
      uiManager.closeSidebar();
    };
  },

  closeSidebar: () => {
    document.getElementById('sidebar').classList.remove('open');
  }
};

// Data loading
const dataLoader = {
  loadEvents: async () => {
    try {
      const response = await fetch(CONFIG.JSON_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const events = await response.json();
      state.events = events.sort((a, b) => a.date.localeCompare(b.date));
      
      uiManager.setupDateInput();
      eventRenderer.renderUpcomingEvents();
      
    } catch (error) {
      console.error('Error loading events:', error);
      document.getElementById('upcoming').innerHTML = 
        '<p class="error">Ошибка загрузки событий. Попробуйте обновить страницу.</p>';
    }
  }
};

// Application initialization
const app = {
  init: () => {
    mapManager.init();
    uiManager.setupSidebarControls();
    dataLoader.loadEvents();
  }
};

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', app.init);

