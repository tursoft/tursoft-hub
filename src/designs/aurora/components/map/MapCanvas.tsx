/**
 * The interactive Leaflet map. Loaded lazily by MapSection when the map box nears the
 * viewport, so Leaflet, its CSS and the OpenStreetMap tiles stay out of the first load
 * and out of the prerendered HTML.
 */
import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, GeoJSON } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Badge } from '../ui/badge'

// Custom CSS for dark theme popups
const darkPopupStyles = `
  .leaflet-popup-content-wrapper {
    background: hsl(var(--background)) !important;
    color: hsl(var(--foreground)) !important;
    border: 1px solid hsl(var(--border)) !important;
    border-radius: 0.5rem !important;
  }
  .leaflet-popup-tip {
    background: hsl(var(--background)) !important;
    border: 1px solid hsl(var(--border)) !important;
  }
  .leaflet-popup-close-button {
    color: hsl(var(--foreground)) !important;
  }
  .leaflet-popup-close-button:hover {
    color: hsl(var(--primary)) !important;
  }
  .leaflet-popup-content-wrapper:hover,
  .leaflet-popup-tip:hover {
    background: hsl(var(--background)) !important;
  }
  .custom-div-icon:hover {
    transform: scale(1.1);
    transition: transform 0.2s ease;
  }
  .map-marker:hover {
    border-color: white !important;
    box-shadow: 0 0 15px 3px rgba(255, 255, 255, 0.5), 0 3px 6px rgba(0,0,0,0.4) !important;
    transform: scale(1.05);
  }
`

// Fix default markers
delete (L.Icon.Default.prototype as unknown as { _getIconUrl: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})


// Create custom icons for different marker types
const createIcon = (color: string, type: string, logoUrl?: string) => {
  const logoHtml = logoUrl 
    ? `<img loading="lazy" decoding="async" src="${logoUrl}" alt="logo" style="width: 30px; height: 30px; border-radius: 10%; object-fit: cover;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
       <span style="display: none; font-size: 10px; color: white; font-weight: bold;">${type.charAt(0).toUpperCase()}</span>`
    : `<span style="font-size: 10px; color: white; font-weight: bold;">${type.charAt(0).toUpperCase()}</span>`

  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="map-marker" style="background-color: ${logoUrl ? 'white' : color}; width: 40px; height: 40px; border-radius: 10%; border: 2px solid ${color}; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 6px rgba(0,0,0,0.4); overflow: hidden; position: relative; transition: all 0.2s ease;">${logoHtml}</div>`,
    iconSize: [50, 50],
    iconAnchor: [15, 5],
  })
}

// Function to create icon with logo
const createIconWithLogo = (type: 'experience' | 'education' | 'customer' | 'partner', logoUrl?: string) => {
  const colors = {
    experience: '#3b82f6',
    education: '#059669',
    customer: '#dc2626',
    partner: '#f59e0b'
  }
  
  // logoUrl is now the full path from companies.json photoUrl
  return createIcon(colors[type], type, logoUrl)
}

export interface MapMarker {
  id: string
  position: [number, number]
  type: 'experience' | 'education' | 'customer' | 'partner'
  title: string
  subtitle?: string
  description: string
  location: string
  period?: string
  technologies?: string[]
  logo?: string
  data: unknown // Store the full data object for dialog display
}

// Custom Marker component that handles hover and click events
function HoverMarker({ 
  marker, 
  icon, 
  onMarkerClick 
}: { 
  marker: MapMarker; 
  icon: L.DivIcon;
  onMarkerClick: (marker: MapMarker) => void;
}) {
  const markerRef = useRef<L.Marker>(null)
  
  const handleMouseOver = () => {
    const markerInstance = markerRef.current
    if (markerInstance) {
      markerInstance.openPopup()
    }
  }

  const handleMouseOut = () => {
    const markerInstance = markerRef.current
    if (markerInstance) {
      // Close popup after a small delay to allow moving to popup
      setTimeout(() => {
        if (markerInstance && markerInstance.getPopup() && !markerInstance.getPopup()?.isOpen()) {
          return
        }
        markerInstance.closePopup()
      }, 100)
    }
  }

  const handleClick = () => {
    onMarkerClick(marker)
  }

  return (
    <Marker
      ref={markerRef}
      position={marker.position}
      icon={icon}
      eventHandlers={{
        mouseover: handleMouseOver,
        mouseout: handleMouseOut,
        click: handleClick,
      }}
    >
      <Popup 
        maxWidth={300} 
        minWidth={250} 
        className="dark-popup"
        closeButton={false}
        autoClose={false}
        closeOnEscapeKey={true}
      >
        <div className="p-2 bg-background text-foreground rounded-lg relative">
          {marker.logo && (
            <div className="absolute top-2 right-2 w-12 h-12 flex-shrink-0">
              <img loading="lazy" decoding="async" 
                src={marker.logo}
                alt={`${marker.title} logo`}
                className="w-full h-full object-contain rounded"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          )}
          <h3 className="font-semibold text-lg mb-1 text-foreground pr-14">{marker.title}</h3>
          <div className="mb-2">
            <Badge 
              variant="secondary" 
              className="text-xs"
              style={{
                backgroundColor: marker.type === 'experience' ? '#3b82f6' : 
                                marker.type === 'education' ? '#059669' : 
                                marker.type === 'customer' ? '#dc2626' : '#f59e0b',
                color: 'white',
                textTransform: 'capitalize'
              }}
            >
              {marker.type}
            </Badge>
          </div>
          {marker.subtitle && (
            <p className="text-sm text-muted-foreground mb-2">{marker.subtitle}</p>
          )}
          <p className="text-sm mb-2 text-foreground/80">{marker.description}</p>
          <div className="flex flex-wrap gap-1 mb-2">
            <Badge variant="secondary" className="text-xs bg-secondary text-secondary-foreground">
              📍 {marker.location}
            </Badge>
            {marker.period && (
              <Badge variant="outline" className="text-xs border-border text-foreground">
                📅 {marker.period}
              </Badge>
            )}
          </div>
        </div>
      </Popup>
    </Marker>
  )
}

// Component to add country hover highlighting
function CountryHighlight() {
  const map = useMap()
  
  useEffect(() => {
    if (!map) return
    
    // Add hover effect for country polygons
    const highlightCountry = (e: L.LeafletMouseEvent) => {
      const layer = e.target
      if (layer && layer.setStyle) {
        layer.setStyle({
          weight: 3,
          color: '#3b82f6',
          dashArray: '',
          fillOpacity: 0.3,
          fillColor: '#3b82f6'
        })
        layer.bringToFront()
      }
    }

    const resetHighlight = (e: L.LeafletMouseEvent) => {
      const layer = e.target
      if (layer && layer.setStyle) {
        layer.setStyle({
          weight: 1,
          opacity: 0.5,
          color: '#666',
          dashArray: '3',
          fillOpacity: 0.1,
          fillColor: '#ccc'
        })
      }
    }

    // Simple country hover effect using map events
    map.on('mouseover', (e) => {
      // This is a basic implementation - for full country boundaries you'd need GeoJSON data
      // For now, we'll just add a subtle overlay effect
    })

    return () => {
      map.off('mouseover')
    }
  }, [map])
  
  return null
}

// Component to handle map bounds
function MapBounds({ markers }: { markers: MapMarker[] }) {
  const map = useMap()
  
  useEffect(() => {
    if (!map || !markers || markers.length === 0) return
    
    // Add a small delay to ensure all markers are rendered
    const timeout = setTimeout(() => {
      try {
        const positions = markers.map(marker => marker.position)
        if (positions.length > 0) {
          const bounds = L.latLngBounds(positions)
          map.fitBounds(bounds, { padding: [20, 20] })
        }
      } catch (error) {
        console.warn('Error fitting map bounds:', error)
      }
    }, 100)
    
    return () => clearTimeout(timeout)
  }, [markers, map])
  
  return null
}

export default function MapCanvas({
  markers,
  onMarkerClick,
}: {
  markers: MapMarker[]
  onMarkerClick: (marker: MapMarker) => void
}) {
  // Dark theme for Leaflet popups
  useEffect(() => {
    const styleElement = document.createElement('style')
    styleElement.textContent = darkPopupStyles
    document.head.appendChild(styleElement)

    return () => {
      document.head.removeChild(styleElement)
    }
  }, [])

  const handleMarkerClick = onMarkerClick

  return (
    <MapContainer
      center={[40, 0]}
      zoom={2}
      style={{ height: '100%', width: '100%' }}
      className="z-0"
      scrollWheelZoom={true}
      attributionControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={18}
        minZoom={2}
      />
      {markers.length > 0 && <MapBounds markers={markers} />}
      <CountryHighlight />
      
      {markers.map((marker) => (
        <HoverMarker
          key={marker.id}
          marker={marker}
          icon={createIconWithLogo(marker.type, marker.logo)}
          onMarkerClick={handleMarkerClick}
        />
      ))}
    </MapContainer>
  )
}
