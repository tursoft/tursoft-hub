import { useEffect, useMemo, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, GeoJSON } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import ExperienceDetailDialog from './ExperienceDetailDialog'
import EducationDetailDialog from './EducationDetailDialog'
import CustomerDetailDialog from './CustomerDetailDialog'

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
const createIcon = (color: string, type: string, logoUrl?: string) => {
  const logoHtml = logoUrl 
    ? `<img src="${logoUrl}" alt="logo" style="width: 20px; height: 20px; border-radius: 50%; object-fit: cover;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
       <span style="display: none; font-size: 10px; color: white; font-weight: bold;">${type.charAt(0).toUpperCase()}</span>`
    : `<span style="font-size: 10px; color: white; font-weight: bold;">${type.charAt(0).toUpperCase()}</span>`

  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${logoUrl ? 'white' : color}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid ${color}; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 6px rgba(0,0,0,0.4); overflow: hidden; position: relative;">${logoHtml}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  })
}

// Function to create icon with logo
const createIconWithLogo = (type: 'experience' | 'education' | 'customer', logoFileName?: string) => {
  const colors = {
    experience: '#3b82f6',
    education: '#059669',
    customer: '#dc2626'
  }
  
  let logoUrl: string | undefined
  
  if (logoFileName) {
    if (type === 'customer') {
      // Customer logos use full path from logoPath
      logoUrl = logoFileName
    } else if ((type === 'experience' || type === 'education') && logoFileName.endsWith('.png')) {
      // Experience and education logos are in companies folder
      logoUrl = `/assets/logos/companies/${logoFileName}`
    }
  }
  
  return createIcon(colors[type], type, logoUrl)
}

interface MapItem {
  uid: string
  type: 'education' | 'experience' | 'customer'
  title: string
  coordinate: { lat: number; lng: number }
  logoUrl?: string
  category: string
  summarytext: string
  city: string
  country: string
  daterange: { start: string; end?: string }
}

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
            <div className="absolute top-2 right-2 w-8 h-8 flex-shrink-0">
              <img 
                src={marker.type === 'customer' ? marker.logo : `/assets/logos/companies/${marker.logo}`}
                alt={`${marker.title} logo`}
                className="w-full h-full object-contain rounded"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          )}
          <h3 className="font-semibold text-lg mb-1 text-foreground pr-10">{marker.title}</h3>
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

export default function MapSection() {
  const [selectedFilters, setSelectedFilters] = useState<string[]>(['experience', 'education', 'customer'])
  const mapRef = useRef<L.Map | null>(null)
  
  // Dialog state management
  const [selectedExperience, setSelectedExperience] = useState<unknown | null>(null)
  const [selectedEducation, setSelectedEducation] = useState<unknown | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<unknown | null>(null)
  const [isExperienceDialogOpen, setIsExperienceDialogOpen] = useState(false)
  const [isEducationDialogOpen, setIsEducationDialogOpen] = useState(false)
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false)

  // Inject dark theme styles
  useEffect(() => {
    const styleElement = document.createElement('style')
    styleElement.textContent = darkPopupStyles
    document.head.appendChild(styleElement)

    return () => {
      document.head.removeChild(styleElement)
    }
  }, [])

  // Function to add small offset to avoid overlapping markers
  const addOffset = (lat: number, lng: number, index: number) => {
    const offset = 0.01 * (index % 8) // Small offset based on index
    const angle = (index * 45) % 360 // Different angle for each marker
    const radians = (angle * Math.PI) / 180
    return [
      lat + offset * Math.sin(radians),
      lng + offset * Math.cos(radians)
    ] as [number, number]
  }

  // Process data to create markers
  const markers = useMemo(() => {
    const result: MapMarker[] = []
    const coordinateCount: { [key: string]: number } = {} // Track how many markers at each coordinate

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

          // Create coordinate key and count markers at same location
          const coordKey = `${coordinates.lat}-${coordinates.lng}`
          const offsetIndex = coordinateCount[coordKey] || 0
          coordinateCount[coordKey] = offsetIndex + 1

          result.push({
            id: `exp-${company.companyCode}-${company.id}-${companyIndex}`,
            position: addOffset(coordinates.lat, coordinates.lng, offsetIndex),
            type: 'experience',
            title: company.companyName,
            subtitle: latestPosition?.title,
            description: latestPosition?.summary || '',
            location,
            period: `${latestPosition?.startDate} - ${latestPosition?.endDate || 'Present'}`,
            technologies: latestPosition?.technologies?.slice(0, 5).map(t => t.name),
            logo: company.icon,
            data: company
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
          // Create coordinate key and count markers at same location
          const coordKey = `${coordinates.lat}-${coordinates.lng}`
          const offsetIndex = coordinateCount[coordKey] || 0
          coordinateCount[coordKey] = offsetIndex + 1

          result.push({
            id: `edu-${school.code}-${school.id}-${schoolIndex}`,
            position: addOffset(coordinates.lat, coordinates.lng, offsetIndex),
            type: 'education',
            title: school.name,
            subtitle: school.department,
            description: school.level,
            location,
            period: school.period,
            technologies: school.technologies?.slice(0, 5).map(t => t.name),
            logo: school.icon,
            data: school
          })
        }
      })
    }

    // Process Customer data
    if (selectedFilters.includes('customer')) {
      customersData.items.forEach((customer, index) => {
        const coordinates = locationCoordinates[customer.location]
        
        if (coordinates) {
          // Create coordinate key and count markers at same location
          const coordKey = `${coordinates.lat}-${coordinates.lng}`
          const offsetIndex = coordinateCount[coordKey] || 0
          coordinateCount[coordKey] = offsetIndex + 1

          result.push({
            id: `cus-${customer.name}-${index}`,
            position: addOffset(coordinates.lat, coordinates.lng, offsetIndex),
            type: 'customer',
            title: customer.title,
            subtitle: customer.industry,
            description: customer.description,
            location: customer.location,
            period: `${customer.partnership.startDate} - ${customer.partnership.endDate || 'Present'}`,
            technologies: customer.technologies?.slice(0, 5),
            logo: customer.logoPath,
            data: customer
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

  // Handle marker click to open appropriate dialog
  const handleMarkerClick = (marker: MapMarker) => {
    switch (marker.type) {
      case 'experience':
        setSelectedExperience(marker.data)
        setIsExperienceDialogOpen(true)
        break
      case 'education':
        setSelectedEducation(marker.data)
        setIsEducationDialogOpen(true)
        break
      case 'customer':
        setSelectedCustomer(marker.data)
        setIsCustomerDialogOpen(true)
        break
    }
  }

  return (
    <section id="map" className="py-20 bg-gradient-to-b from-background via-secondary/50 to-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent">
            Global 
            <span className="bg-gradient-to-r from-[hsl(var(--navy-deep))] via-[hsl(var(--primary))] to-[hsl(var(--primary-light))] bg-clip-text text-transparent block lg:inline lg:ml-4">Footprint</span>            
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

        {/* Detail Dialogs */}
        <ExperienceDetailDialog
          experience={selectedExperience as never}
          isOpen={isExperienceDialogOpen}
          onClose={() => {
            setIsExperienceDialogOpen(false)
            setSelectedExperience(null)
          }}
        />
        
        <EducationDetailDialog
          education={selectedEducation as never}
          isOpen={isEducationDialogOpen}
          onClose={() => {
            setIsEducationDialogOpen(false)
            setSelectedEducation(null)
          }}
          educationIcon={(selectedEducation as Record<string, unknown>)?.icon as string}
        />
        
        <CustomerDetailDialog
          customer={selectedCustomer as never}
          isOpen={isCustomerDialogOpen}
          onClose={() => {
            setIsCustomerDialogOpen(false)
            setSelectedCustomer(null)
          }}
          customerLogo={(selectedCustomer as Record<string, unknown>)?.logoPath as string}
        />
      </div>
    </section>
  )
}