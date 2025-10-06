import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { MAP_OPTIONS } from '../config.js';
import { clearMarkers, addMarker, CustomNavigationControl } from '../utils/map.js';

function MapContainer({ events, selectedDate, selectedEvent, onEventSelect }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const mapOptions = {
      ...MAP_OPTIONS,
      container: mapContainerRef.current
    };

    const map = new maplibregl.Map(mapOptions);

    map.addControl(new CustomNavigationControl(), 'top-right');
    map.addControl(new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      showUserLocation: true,
      labelText: 'Find my location',
      noLocationText: 'Geolocation unavailable',
      searchingText: 'Searching for location...',
      foundText: 'My location'
    }), 'top-right');

    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();

    // Устанавливаем глобальный доступ к карте (для совместимости)
    window.currentMap = map;
    window.mapInstance = map;

    map.on('load', () => {
      console.log('Карта загружена');
      // Ждем немного и рендерим события
      setTimeout(() => renderDayEvents(), 100);
    });

    mapInstanceRef.current = map;

    // Очистка при размонтировании
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        if (window.currentMap === map) {
          window.currentMap = null;
        }
      }
    };
  }, []);

  // Эффект для рендера событий при изменении даты
  useEffect(() => {
    if (mapInstanceRef.current && events.length) {
      renderDayEvents();
    }
  }, [selectedDate, events]);

  // Эффект для выделения события
  useEffect(() => {
    if (selectedEvent && mapInstanceRef.current) {
      // Fly to event
      mapInstanceRef.current.flyTo({
        center: [selectedEvent.lon, selectedEvent.lat],
        zoom: 14
      });
    }
  }, [selectedEvent]);

  const renderDayEvents = () => {
    if (!mapInstanceRef.current) return;

    clearMarkers();

    const dayEvents = events.filter(e => e.date === selectedDate);
    dayEvents.forEach(event => addMarker(event, onEventSelect, mapInstanceRef.current));

    if (dayEvents.length > 0) {
      const first = dayEvents[0];
      mapInstanceRef.current.flyTo({
        center: [first.lon, first.lat],
        zoom: dayEvents.length > 1 ? 12 : 14
      });
    }
  };

  return (
    <div className="map-container-wrapper">
      <div ref={mapContainerRef} className="map-container" />
    </div>
  );
}

export default MapContainer;
