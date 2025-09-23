import { useEffect, useMemo, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Card } from './ui/card'
import { Badge } from './ui/badge'

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
`

// Import data
import experiencesData from '@/data/experiences.json'
import educationData from '@/data/education.json'
import customersData from '@/data/customers.json'

// Fix default markers
delete (L.Icon.Default.prototype as unknown as { _getIconUrl: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Location coordinates mapping
const locationCoordinates: { [key: string]: { lat: number; lng: number; country: string } } = {
  // Experience Companies
  'Cincinnati, Ohio, USA': { lat: 39.1031, lng: -84.5120, country: 'United States' },
  'New York, NY, USA': { lat: 40.7128, lng: -74.0060, country: 'United States' },
  'New Hampshire, USA': { lat: 43.1939, lng: -71.5724, country: 'United States' },
  'Pennsylvania, USA': { lat: 40.2732, lng: -76.8867, country: 'United States' },
  'Southeast USA': { lat: 33.7490, lng: -84.3880, country: 'United States' }, // Atlanta
  'Mid-Atlantic USA': { lat: 39.7391, lng: -75.5398, country: 'United States' }, // Philadelphia area
  'Northeast USA': { lat: 42.3601, lng: -71.0589, country: 'United States' }, // Boston area
  'Southwest USA': { lat: 33.4484, lng: -112.0740, country: 'United States' }, // Phoenix
  'Pacific Northwest USA': { lat: 47.6062, lng: -122.3321, country: 'United States' }, // Seattle
  'South Central USA': { lat: 32.7767, lng: -96.7970, country: 'United States' }, // Dallas
  'Southern USA': { lat: 33.7490, lng: -84.3880, country: 'United States' }, // Atlanta
  'Western USA': { lat: 34.0522, lng: -118.2437, country: 'United States' }, // Los Angeles
  'Eastern USA': { lat: 40.7128, lng: -74.0060, country: 'United States' }, // New York
  'Ankara, Turkey': { lat: 39.9334, lng: 32.8597, country: 'Turkey' },
  'Istanbul, Turkey': { lat: 41.0082, lng: 28.9784, country: 'Turkey' },
  'Kocaeli, Turkey': { lat: 40.8533, lng: 29.8815, country: 'Turkey' },
  'Neuhausen, Switzerland': { lat: 47.6779, lng: 8.6089, country: 'Switzerland' },
  'Tashkent, Uzbekistan': { lat: 41.2995, lng: 69.2401, country: 'Uzbekistan' },
  'Lisbon, Portugal': { lat: 38.7223, lng: -9.1393, country: 'Portugal' },
  'Ramallah, Palestine': { lat: 31.9073, lng: 35.2044, country: 'Palestine' },
  'Riyadh, Saudi Arabia': { lat: 24.7136, lng: 46.6753, country: 'Saudi Arabia' },
  'Abu Dhabi': { lat: 24.4539, lng: 54.3773, country: 'United Arab Emirates' },

  // Add other locations as needed
  'Remote': { lat: 0, lng: 0, country: 'Global' },
}

// Create custom icons for different marker types
const createIcon = (color: string, type: string) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 25px; height: 25px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 10px; color: white; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${type.charAt(0)}</div>`,
    iconSize: [25, 25],
    iconAnchor: [12, 12],
  })
}

const experienceIcon = createIcon('#3b82f6', 'E')
const educationIcon = createIcon('#059669', 'S')
const customerIcon = createIcon('#dc2626', 'C')

interface MapMarker {
  id: string
  position: [number, number]
  type: 'experience' | 'education' | 'customer'
  title: string
  subtitle?: string
  description: string
  location: string
  period?: string
  technologies?: string[]
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

export default function MapSection() {
  const [selectedFilters, setSelectedFilters] = useState<string[]>(['experience', 'education', 'customer'])
  const mapRef = useRef<L.Map | null>(null)

  // Inject dark theme styles
  useEffect(() => {
    const styleElement = document.createElement('style')
    styleElement.textContent = darkPopupStyles
    document.head.appendChild(styleElement)

    return () => {
      document.head.removeChild(styleElement)
    }
  }, [])

  // Process data to create markers
  const markers = useMemo(() => {
    const result: MapMarker[] = []

    // Process Experience data
    if (selectedFilters.includes('experience')) {
      experiencesData.items.forEach((company, companyIndex) => {
        // Try to find location from company name or use company location from customers
        let location = ''
        let coordinates: { lat: number; lng: number } | undefined

        // Look for company in customers data first
        const customerMatch = customersData.items.find(customer => 
          customer.companyCodes?.includes(company.companyCode) || 
          company.companyName.toLowerCase().includes(customer.name.toLowerCase()) ||
          customer.title.toLowerCase().includes(company.companyName.toLowerCase())
        )

        if (customerMatch?.location) {
          location = customerMatch.location
          coordinates = locationCoordinates[location]
        }

        // Fallback locations based on company names
        if (!coordinates) {
          if (company.companyName.toLowerCase().includes('jengai') || company.companyName.toLowerCase().includes('gamyte')) {
            location = 'Cincinnati, Ohio, USA'
            coordinates = locationCoordinates[location]
          } else if (company.companyName.toLowerCase().includes('infrion')) {
            location = 'Remote'
            coordinates = { lat: 50.0, lng: 10.0 } // Europe center
          } else if (company.companyName.toLowerCase().includes('erc') || 
                     company.companyName.toLowerCase().includes('datasel') ||
                     company.companyName.toLowerCase().includes('fonet') ||
                     company.companyName.toLowerCase().includes('halıcı')) {
            location = 'Ankara, Turkey'
            coordinates = locationCoordinates[location]
          } else if (company.companyName.toLowerCase().includes('metu')) {
            location = 'Ankara, Turkey'
            coordinates = locationCoordinates[location]
          } else if (company.companyName.toLowerCase().includes('jandarma')) {
            location = 'Ankara, Turkey'
            coordinates = locationCoordinates[location]
          } else if (company.companyName.toLowerCase().includes('labris')) {
            location = 'Ankara, Turkey'
            coordinates = locationCoordinates[location]
          }
        }

        if (coordinates) {
          // Get latest position for period info
          const latestPosition = company.positions.sort((a, b) => 
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
          )[0]

          result.push({
            id: `exp-${company.companyCode}-${company.id}-${companyIndex}`,
            position: [coordinates.lat, coordinates.lng],
            type: 'experience',
            title: company.companyName,
            subtitle: latestPosition?.title,
            description: latestPosition?.summary || '',
            location,
            period: `${latestPosition?.startDate} - ${latestPosition?.endDate || 'Present'}`,
            technologies: latestPosition?.technologies?.slice(0, 5).map(t => t.name)
          })
        }
      })
    }

    // Process Education data
    if (selectedFilters.includes('education')) {
      educationData.items.forEach((school, schoolIndex) => {
        let coordinates: { lat: number; lng: number } | undefined
        let location = school.city || ''

        if (school.name.toLowerCase().includes('metu') || school.name.toLowerCase().includes('middle east')) {
          location = 'Ankara, Turkey'
          coordinates = locationCoordinates[location]
        } else if (school.city) {
          // Try to find coordinates for the city
          const cityKey = Object.keys(locationCoordinates).find(key => 
            key.toLowerCase().includes(school.city!.toLowerCase())
          )
          if (cityKey) {
            coordinates = locationCoordinates[cityKey]
            location = cityKey
          }
        }

        if (coordinates) {
          result.push({
            id: `edu-${school.code}-${school.id}-${schoolIndex}`,
            position: [coordinates.lat, coordinates.lng],
            type: 'education',
            title: school.name,
            subtitle: school.department,
            description: school.level,
            location,
            period: school.period,
            technologies: school.technologies?.slice(0, 5).map(t => t.name)
          })
        }
      })
    }

    // Process Customer data
    if (selectedFilters.includes('customer')) {
      customersData.items.forEach((customer, index) => {
        const coordinates = locationCoordinates[customer.location]
        
        if (coordinates) {
          result.push({
            id: `cus-${customer.name}-${index}`,
            position: [coordinates.lat, coordinates.lng],
            type: 'customer',
            title: customer.title,
            subtitle: customer.industry,
            description: customer.description,
            location: customer.location,
            period: `${customer.partnership.startDate} - ${customer.partnership.endDate || 'Present'}`,
            technologies: customer.technologies?.slice(0, 5)
          })
        }
      })
    }

    return result
  }, [selectedFilters])

  const toggleFilter = (filter: string) => {
    setSelectedFilters(prev => 
      prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    )
  }

  return (
    <section id="map" className="py-20 bg-gradient-to-b from-background via-secondary/50 to-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent">
            Global Footprint
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Explore the worldwide locations of companies I've worked with, institutions where I've studied, 
            and clients I've served throughout my career.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <button
            onClick={() => toggleFilter('experience')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
              selectedFilters.includes('experience')
                ? 'bg-blue-500 text-white'
                : 'bg-secondary text-muted-foreground hover:bg-blue-100'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-blue-500"></div>
            Experience ({experiencesData.items.length})
          </button>
          <button
            onClick={() => toggleFilter('education')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
              selectedFilters.includes('education')
                ? 'bg-green-600 text-white'
                : 'bg-secondary text-muted-foreground hover:bg-green-100'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-green-600"></div>
            Education ({educationData.items.length})
          </button>
          <button
            onClick={() => toggleFilter('customer')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
              selectedFilters.includes('customer')
                ? 'bg-red-600 text-white'
                : 'bg-secondary text-muted-foreground hover:bg-red-100'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-red-600"></div>
            Customers ({customersData.items.length})
          </button>
        </div>

        {/* Map */}
        <Card className="overflow-hidden">
          <div className="h-[600px] w-full">
            <MapContainer
              center={[40, 0]}
              zoom={2}
              style={{ height: '100%', width: '100%' }}
              className="z-0"
              scrollWheelZoom={true}
              attributionControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                maxZoom={18}
                minZoom={2}
              />
              {markers.length > 0 && <MapBounds markers={markers} />}
              
              {markers.map((marker) => (
                <Marker
                  key={marker.id}
                  position={marker.position}
                  icon={
                    marker.type === 'experience' ? experienceIcon :
                    marker.type === 'education' ? educationIcon :
                    customerIcon
                  }
                >
                  <Popup maxWidth={300} minWidth={250} className="dark-popup">
                    <div className="p-2 bg-background text-foreground rounded-lg">
                      <h3 className="font-semibold text-lg mb-1 text-foreground">{marker.title}</h3>
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
                      {marker.technologies && marker.technologies.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground mb-1">Key Technologies:</p>
                          <div className="flex flex-wrap gap-1">
                            {marker.technologies.map((tech, index) => (
                              <Badge key={index} variant="outline" className="text-xs border-border text-foreground">
                                {tech}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-500 mb-2">{experiencesData.items.length}</div>
            <div className="text-muted-foreground">Companies Worked With</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">{educationData.items.length}</div>
            <div className="text-muted-foreground">Educational Institutions</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-red-600 mb-2">{customersData.items.length}</div>
            <div className="text-muted-foreground">Clients Served</div>
          </Card>
        </div>
      </div>
    </section>
  )
}