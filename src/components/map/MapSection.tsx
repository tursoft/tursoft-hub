import { useEffect, useMemo, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, GeoJSON } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Map, Grid } from 'lucide-react'
import ExperienceDetailDialog from '../experiences/ExperienceDetailDialog'
import EducationDetailDialog from '../educations/EducationDetailDialog'
import CustomerDetailDialog from '../customers/CustomerDetailDialog'

// Import specific interfaces from models for type safety
import type { Education } from '@/models/Education'
import type { Experience, Position } from '@/models/Experience'
import type { Customer } from '@/models/Customer'

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
import companiesData from '@/data/companies.json'
import type { CompaniesData } from '@/models/Companies'

// Cast companies data to proper type
const companies = companiesData as CompaniesData

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
    ? `<img src="${logoUrl}" alt="logo" style="width: 30px; height: 30px; border-radius: 10%; object-fit: cover;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
       <span style="display: none; font-size: 10px; color: white; font-weight: bold;">${type.charAt(0).toUpperCase()}</span>`
    : `<span style="font-size: 10px; color: white; font-weight: bold;">${type.charAt(0).toUpperCase()}</span>`

  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${logoUrl ? 'white' : color}; width: 40px; height: 40px; border-radius: 10%; border: 2px solid ${logoUrl ? 'white' : color}; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 6px rgba(0,0,0,0.4); overflow: hidden; position: relative;">${logoHtml}</div>`,
    iconSize: [50, 50],
    iconAnchor: [15, 5],
  })
}

// Function to create icon with logo
const createIconWithLogo = (type: 'experience' | 'education' | 'customer', logoUrl?: string) => {
  const colors = {
    experience: '#3b82f6',
    education: '#059669',
    customer: '#dc2626'
  }
  
  // logoUrl is now the full path from companies.json photoUrl
  return createIcon(colors[type], type, logoUrl)
}

export interface MapItem {
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

// Helper functions to transform data into MapItem objects
const transformExperienceToMapItem = (experience: Experience, index: number): MapItem | null => {
  // Get company data from companyCode
  const company = companies.items.find(c => c.code === experience.companyCode)
  if (!company || !company.coordinates) return null

  const latestPosition = experience.positions?.sort((a, b) => 
    new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  )?.[0]

  const logoUrl = company.photoUrl || undefined

  return {
    uid: `experience.${experience.companyCode}.${index}`,
    type: 'experience',
    title: company.title || '',
    coordinate: company.coordinates,
    logoUrl,
    category: latestPosition?.title || 'Professional Experience',
    summarytext: latestPosition?.summary || '',
    city: company.city,
    country: company.country,
    daterange: {
      start: latestPosition?.startDate || '',
      end: latestPosition?.endDate || undefined
    }
  }
}

const transformEducationToMapItem = (school: Education, index: number): MapItem | null => {
  // Get company data from companyCode
  const company = companies.items.find(c => c.code === school.companyCode)
  if (!company || !company.coordinates) return null

  const logoUrl = company.photoUrl || undefined

  return {
    uid: `education.${school.code}.${index}`,
    type: 'education',
    title: company.title || '',
    coordinate: company.coordinates,
    logoUrl,
    category: school.level || 'Education',
    summarytext: school.department || '',
    city: company.city || '',
    country: company.country || '',
    daterange: {
      start: school.period?.split(' - ')[0] || school.datePeriod?.startDate || '',
      end: school.period?.split(' - ')[1] || school.datePeriod?.endDate
    }
  }
}

const transformCustomerToMapItem = (customer: Customer, index: number): MapItem | null => {
  // Get company data from companyCode
  const company = companies.items.find(c => c.code === customer.companyCode)
  if (!company || !company.coordinates) return null

  // Parse location if available (format: "City, Country")
  const locationParts = customer.location?.split(',').map(s => s.trim()) || []
  const city = locationParts[0] || company.city
  const country = locationParts[1] || company.country

  return {
    uid: `customer.${customer.code}.${index}`,
    type: 'customer',
    title: company.title || '',
    coordinate: company.coordinates,
    logoUrl: company.photoUrl,
    category: customer.industry || 'Client',
    summarytext: customer.description || '',
    city: city || '',
    country: country || '',
    daterange: {
      start: customer.partnership?.startDate || '',
      end: customer.partnership?.endDate
    }
  }
}

// Utility function to create all MapItems from data sources
const createMapItemsFromData = (filters: string[] = ['experience', 'education', 'customer']): MapItem[] => {
  const result: MapItem[] = []

  if (filters.includes('experience')) {
    experiencesData.items.forEach((company, index) => {
      const mapItem = transformExperienceToMapItem(company as Experience, index)
      if (mapItem) result.push(mapItem)
    })
  }

  if (filters.includes('education')) {
    educationData.items.forEach((school, index) => {
      const mapItem = transformEducationToMapItem(school as Education, index)
      if (mapItem) result.push(mapItem)
    })
  }

  if (filters.includes('customer')) {
    customersData.items.forEach((customer, index) => {
      const mapItem = transformCustomerToMapItem(customer as Customer, index)
      if (mapItem) result.push(mapItem)
    })
  }

  return result
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
              <img 
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
  const [viewMode, setViewMode] = useState<'map' | 'grid'>('map')
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

  // Generate MapItems from all data sources
  const mapItems = useMemo(() => {
    const result: MapItem[] = []

    // Transform Experience data to MapItems
    if (selectedFilters.includes('experience')) {
      experiencesData.items.forEach((company, index) => {
        const mapItem = transformExperienceToMapItem(company as Experience, index)
        if (mapItem) result.push(mapItem)
      })
    }

    // Transform Education data to MapItems
    if (selectedFilters.includes('education')) {
      educationData.items.forEach((school, index) => {
        const mapItem = transformEducationToMapItem(school as Education, index)
        if (mapItem) result.push(mapItem)
      })
    }

    // Transform Customer data to MapItems
    if (selectedFilters.includes('customer')) {
      customersData.items.forEach((customer, index) => {
        const mapItem = transformCustomerToMapItem(customer as Customer, index)
        if (mapItem) result.push(mapItem)
      })
    }

    return result
  }, [selectedFilters])

  // Convert MapItems to MapMarkers for rendering
  const markers = useMemo(() => {
    const result: MapMarker[] = []
    const coordinateCount: { [key: string]: number } = {} // Track how many markers at each coordinate

    mapItems.forEach((mapItem, index) => {
      // Create coordinate key and count markers at same location
      const coordKey = `${mapItem.coordinate.lat}-${mapItem.coordinate.lng}`
      const offsetIndex = coordinateCount[coordKey] || 0
      coordinateCount[coordKey] = offsetIndex + 1

      // Find original data object for dialogs by extracting code from uid
      let originalData: unknown = null
      if (mapItem.type === 'experience') {
        // uid format: experience.{companyCode}.{index}
        const companyCode = mapItem.uid.split('.')[1]
        originalData = experiencesData.items.find(item => item.companyCode === companyCode)
      } else if (mapItem.type === 'education') {
        // uid format: education.{code}.{index}
        const code = mapItem.uid.split('.')[1]
        originalData = educationData.items.find(item => item.code === code)
      } else if (mapItem.type === 'customer') {
        // uid format: customer.{code}.{index}
        const code = mapItem.uid.split('.')[1]
        originalData = customersData.items.find(item => item.code === code)
      }

      const period = mapItem.daterange.end 
        ? `${mapItem.daterange.start} - ${mapItem.daterange.end}`
        : `${mapItem.daterange.start} - Present`

      result.push({
        id: mapItem.uid,
        position: addOffset(mapItem.coordinate.lat, mapItem.coordinate.lng, offsetIndex),
        type: mapItem.type,
        title: mapItem.title,
        subtitle: mapItem.category,
        description: mapItem.summarytext,
        location: `${mapItem.city}, ${mapItem.country}`,
        period,
        technologies: [], // Technologies would need to be extracted from original data if needed
        logo: mapItem.logoUrl, // Keep full path as is
        data: originalData
      })
    })

    return result
  }, [mapItems])

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

  // Handle grid row click to open appropriate dialog
  const handleRowClick = (item: MapItem) => {
    // Find the original data object for dialogs by extracting code from uid
    let originalData: unknown = null
    if (item.type === 'experience') {
      // uid format: experience.{companyCode}.{index}
      const companyCode = item.uid.split('.')[1]
      originalData = experiencesData.items.find(exp => exp.companyCode === companyCode)
    } else if (item.type === 'education') {
      // uid format: education.{code}.{index}
      const code = item.uid.split('.')[1]
      originalData = educationData.items.find(edu => edu.code === code)
    } else if (item.type === 'customer') {
      // uid format: customer.{code}.{index}
      const code = item.uid.split('.')[1]
      originalData = customersData.items.find(cust => cust.code === code)
    }

    switch (item.type) {
      case 'experience':
        setSelectedExperience(originalData)
        setIsExperienceDialogOpen(true)
        break
      case 'education':
        setSelectedEducation(originalData)
        setIsEducationDialogOpen(true)
        break
      case 'customer':
        setSelectedCustomer(originalData)
        setIsCustomerDialogOpen(true)
        break
    }
  }

  return (
    <section id="map" className="py-20 bg-gradient-to-b from-background via-secondary/50 to-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">Global Presence</Badge>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Global
            <span className="bg-gradient-to-r from-[hsl(var(--navy-deep))] via-[hsl(var(--primary))] to-[hsl(var(--primary-light))] bg-clip-text text-transparent block lg:inline lg:ml-4">Footprint</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Explore the worldwide locations of companies I've worked with, institutions where I've studied, 
            and clients I've served throughout my career.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex justify-center mb-6">
          <div className="flex bg-secondary rounded-lg p-1">
            <Button
              variant={viewMode === 'map' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('map')}
              className="flex items-center gap-2"
            >
              <Map className="w-4 h-4" />
              Map View
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="flex items-center gap-2"
            >
              <Grid className="w-4 h-4" />
              Grid View
            </Button>
          </div>
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

        {/* Map or Grid View */}
        <Card className="overflow-hidden">
          {viewMode === 'map' ? (
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
          ) : (
            <div className="max-h-[600px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date Range</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>City</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mapItems.map((item) => {
                    const typeColors = {
                      experience: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
                      education: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                      customer: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }
                    
                    const dateRange = item.daterange.end 
                      ? `${item.daterange.start} - ${item.daterange.end}`
                      : `${item.daterange.start} - Present`

                    // Get logo URL for the item
                    const getLogoUrl = (item: MapItem) => {
                      if (item.logoUrl) {
                        return item.logoUrl
                      }
                      return null
                    }

                    const logoUrl = getLogoUrl(item)

                    return (
                      <TableRow 
                        key={item.uid} 
                        className="hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleRowClick(item)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            {logoUrl ? (
                              <img 
                                src={logoUrl}
                                alt={`${item.title} logo`}
                                className="w-6 h-6 object-contain rounded flex-shrink-0"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-6 h-6 bg-muted rounded flex items-center justify-center flex-shrink-0">
                                <span className="text-xs text-muted-foreground font-medium">
                                  {item.type.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <span>{item.title}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={typeColors[item.type]}>
                            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{dateRange}</TableCell>
                        <TableCell>{item.country}</TableCell>
                        <TableCell>{item.city}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              {mapItems.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  No items match the selected filters.
                </div>
              )}
            </div>
          )}
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