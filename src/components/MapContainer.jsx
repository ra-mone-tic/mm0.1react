import { useEffect, useRef, useCallback, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { MAP_OPTIONS } from '../config.js';
import { clearMarkers, addMarker, CustomNavigationControl, getMarkerById } from '../utils/map.js';

function MapContainer({ events, selectedDate, selectedEvent, onEventSelect }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const renderDayEvents = useCallback(() => {
    if (!mapInstanceRef.current) return;

    clearMarkers();

    const dayEvents = events.filter(e => e.date === selectedDate);
    dayEvents.forEach(event => addMarker(event, onEventSelect, mapInstanceRef.current, event.id === selectedEvent?.id));

    // Auto open popup for selected event
    if (selectedEvent) {
      const marker = getMarkerById(selectedEvent.id);
      if (marker && marker.getPopup()) {
        marker.togglePopup();
      }
    }
  }, [events, selectedDate, onEventSelect, selectedEvent, mapInstanceRef]);

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

    const onMapLoad = () => {
      setMapLoaded(true);
    };

    map.on('load', onMapLoad);

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
    if (mapInstanceRef.current && mapLoaded && events.length) {
      renderDayEvents();
    }
  }, [selectedDate, events, mapLoaded, onEventSelect, renderDayEvents]);

  // Эффект для выделения события с маркером
  useEffect(() => {
    if (selectedEvent && mapInstanceRef.current && mapLoaded) {
      // Fly to event
      mapInstanceRef.current.flyTo({
        center: [selectedEvent.lon, selectedEvent.lat],
        zoom: 14,
        duration: 2000 // Увеличиваем длительность анимации для плавности
      });
    }
  }, [selectedEvent, mapLoaded]);

  return (
    <div className="map-container-wrapper">
      <div ref={mapContainerRef} className="map-container" />
    </div>
  );
}

export default MapContainer;
