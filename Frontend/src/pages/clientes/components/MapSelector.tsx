import { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, LayersControl } from 'react-leaflet';
import { X, Navigation, MapPin } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapSelector.css';

// Fix para los iconos de Leaflet en React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (coordinates: string) => void;
  initialCoordinates?: string;
}

// Componente para forzar el resize del mapa
function MapResizer() {
  const map = useMap();
  
  useEffect(() => {
    // Múltiples intentos para asegurar que el mapa se renderice
    const timer1 = setTimeout(() => map.invalidateSize(), 100);
    const timer2 = setTimeout(() => map.invalidateSize(), 200);
    const timer3 = setTimeout(() => map.invalidateSize(), 300);
    const timer4 = setTimeout(() => map.invalidateSize(), 500);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [map]);
  
  return null;
}

// Botón para centrar en la ubicación actual
function CurrentLocationButton({ onLocationFound }: { onLocationFound: (pos: [number, number]) => void }) {
  const map = useMap();
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          map.setView([lat, lng], 15);
          onLocationFound([lat, lng]);
          setLoading(false);
        },
        (error) => {
          console.error('Error obteniendo ubicación:', error);
          alert('No se pudo obtener tu ubicación. Verifica los permisos del navegador.');
          setLoading(false);
        }
      );
    } else {
      alert('Tu navegador no soporta geolocalización');
      setLoading(false);
    }
  };

  return (
    <div className="leaflet-top leaflet-right" style={{ marginTop: '80px' }}>
      <div className="leaflet-control leaflet-bar">
        <button
          onClick={handleClick}
          disabled={loading}
          title="Mi ubicación actual"
          style={{
            width: '30px',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            background: 'white',
            cursor: loading ? 'wait' : 'pointer',
            borderRadius: '4px'
          }}
        >
          <Navigation size={18} color={loading ? '#999' : '#0078A8'} />
        </button>
      </div>
    </div>
  );
}

function LocationMarker({ position, onPositionChange }: { 
  position: [number, number]; 
  onPositionChange: (pos: [number, number]) => void 
}) {
  const map = useMapEvents({
    click(e) {
      onPositionChange([e.latlng.lat, e.latlng.lng]);
    },
  });

  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom());
    }
  }, [position, map]);

  return <Marker position={position} />;
}

export default function MapSelector({ isOpen, onClose, onSelect, initialCoordinates }: MapSelectorProps) {
  const defaultPosition: [number, number] = [-19.049882, -65.247166];
  
  const parseCoordinates = useCallback((coords?: string): [number, number] => {
    if (!coords) return defaultPosition;
    const parts = coords.split(',').map(p => parseFloat(p.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return [parts[0], parts[1]];
    }
    return defaultPosition;
  }, []);

  const [position, setPosition] = useState<[number, number]>(() => parseCoordinates(initialCoordinates));
  const [searchQuery, setSearchQuery] = useState('');
  const [mapKey, setMapKey] = useState(0);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimer = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      const coords = parseCoordinates(initialCoordinates);
      setPosition(coords);
      // Incrementar la key para forzar el re-render del mapa
      setMapKey(prev => prev + 1);
      
      // Intentar obtener ubicación actual si no hay coordenadas iniciales
      if (!initialCoordinates && 'geolocation' in navigator && !useCurrentLocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            setPosition([lat, lng]);
            setUseCurrentLocation(true);
          },
          (error) => {
            console.log('No se pudo obtener ubicación actual:', error.message);
          }
        );
      }
    } else {
      setSearchQuery('');
      setUseCurrentLocation(false);
    }
  }, [isOpen, initialCoordinates, parseCoordinates]);

  const handleConfirm = useCallback(() => {
    const coordinates = `${position[0].toFixed(6)},${position[1].toFixed(6)}`;
    onSelect(coordinates);
    onClose();
  }, [position, onSelect, onClose]);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Bolivia')}&limit=5&addressdetails=1`
      );
      const data = await response.json();
      setSuggestions(data);
      setShowSuggestions(data.length > 0);
    } catch (error) {
      console.error('Error al obtener sugerencias:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, []);

  const handleSearchInputChange = useCallback((value: string) => {
    setSearchQuery(value);
    
    // Limpiar el timer anterior
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    // Crear nuevo timer para buscar después de 500ms
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 500);
  }, [fetchSuggestions]);

  const handleSelectSuggestion = useCallback((suggestion: any) => {
    const { lat, lon, display_name } = suggestion;
    setPosition([parseFloat(lat), parseFloat(lon)]);
    setSearchQuery(display_name);
    setSuggestions([]);
    setShowSuggestions(false);
  }, []);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    
    setShowSuggestions(false);
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ', Bolivia')}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setPosition([parseFloat(lat), parseFloat(lon)]);
      } else {
        alert('No se encontró la ubicación');
      }
    } catch (error) {
      console.error('Error al buscar ubicación:', error);
      alert('Error al buscar la ubicación');
    }
  }, [searchQuery]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
      setShowSuggestions(false);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  }, [handleSearch]);

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const handlePositionChange = useCallback((newPos: [number, number]) => {
    setPosition(newPos);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-map-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Seleccionar Ubicación en el Mapa</h3>
          <button className="modal-close" onClick={onClose} type="button">
            <X size={24} />
          </button>
        </div>

        <div className="modal-body-map">
          <div className="map-search" style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Buscar dirección (ej. Plaza Murillo, La Paz)"
              value={searchQuery}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              autoComplete="off"
            />
            <button onClick={handleSearch} className="btn-primary" type="button">
              Buscar
            </button>
            
            {showSuggestions && suggestions.length > 0 && (
              <div className="search-suggestions">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="suggestion-item"
                    onClick={() => handleSelectSuggestion(suggestion)}
                  >
                    <MapPin size={16} className="suggestion-icon" />
                    <div className="suggestion-content">
                      <div className="suggestion-name">
                        {suggestion.name || suggestion.display_name.split(',')[0]}
                      </div>
                      <div className="suggestion-address">
                        {suggestion.display_name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="map-info">
            <p>
              <strong>Coordenadas seleccionadas:</strong> {position[0].toFixed(6)}, {position[1].toFixed(6)}
            </p>
            <p className="map-hint">Haz clic en el mapa para seleccionar una ubicación</p>
          </div>

          <div className="map-wrapper" style={{ height: '450px', width: '100%' }}>
            <MapContainer
              key={mapKey}
              center={position}
              zoom={17}
              scrollWheelZoom={true}
              zoomControl={true}
              maxZoom={19}
              style={{ height: '450px', width: '100%', position: 'relative' }}
            >
              <MapResizer />
              <LayersControl position="topright">
                <LayersControl.BaseLayer checked name="Mapa Estándar">
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    maxZoom={19}
                    minZoom={3}
                  />
                </LayersControl.BaseLayer>
                
                <LayersControl.BaseLayer name="Satélite">
                  <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    attribution='&copy; <a href="https://www.esri.com">Esri</a>'
                    maxZoom={18}
                    maxNativeZoom={18}
                    minZoom={1}
                  />
                </LayersControl.BaseLayer>
              </LayersControl>
              
              <CurrentLocationButton onLocationFound={handlePositionChange} />
              <LocationMarker position={position} onPositionChange={handlePositionChange} />
            </MapContainer>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary" type="button">
            Cancelar
          </button>
          <button onClick={handleConfirm} className="btn-primary" type="button">
            Confirmar Ubicación
          </button>
        </div>
      </div>
    </div>
  );
}
