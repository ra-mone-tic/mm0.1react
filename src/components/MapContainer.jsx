import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { MAP_OPTIONS } from '../config.js';
import { clearMarkers, addMarker, CustomNavigationControl } from '../utils/map.js';

function MapContainer({ events, selectedDate, selectedEvent, onEventSelect }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const renderDayEvents = () => {
    if (!mapInstanceRef.current) return;

    clearMarkers();

    const dayEvents = events.filter(e => e.date === selectedDate);
    dayEvents.forEach(event => addMarker(event, onEventSelect, mapInstanceRef.current));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      renderDayEvents();
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
    if (mapInstanceRef.current && events.length) {
      renderDayEvents();
    }
  }, [selectedDate, events, onEventSelect]);

  // Эффект для выделения события с маркером
  useEffect(() => {
    if (selectedEvent && mapInstanceRef.current) {
      // Fly to event
      mapInstanceRef.current.flyTo({
        center: [selectedEvent.lon, selectedEvent.lat],
        zoom: 14
      });

      // Очистить все маркеры и добавить маркер для выбранного события
      clearMarkers();
      const marker = addMarker(selectedEvent, onEventSelect, mapInstanceRef.current);

      // Автоматически открыть поп-ап для выбранного события
      if (marker) {
        marker.togglePopup();
      }
    }
  }, [selectedEvent, onEventSelect]);

  return (
    <div className="map-container-wrapper">
      <div ref={mapContainerRef} className="map-container" />
    </div>
  );
}

export default MapContainer;
