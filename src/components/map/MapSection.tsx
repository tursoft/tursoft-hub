import { useEffect, useMemo, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Map as MapIcon, Maximize2, Minimize2, Rows3 } from 'lucide-react'
import { Button } from '../ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import ExperienceDetailDialog from '../experiences/ExperienceDetailDialog'
import EducationDetailDialog from '../educations/EducationDetailDialog'
import CustomerDetailDialog from '../customers/CustomerDetailDialog'
import PartnerDetailDialog from '../partners/PartnerDetailDialog'
import Chip, { ChipRow } from '../system/Chip'
import LogoTile from '../system/LogoTile'
import Reveal from '../system/Reveal'
import Section from '../system/Section'
import SectionHeader from '../system/SectionHeader'
import SegmentedControl from '../system/SegmentedControl'
import Surface from '../system/Surface'
import Tag from '../system/Tag'
import { ENTITY_HEX_COLORS, ENTITY_TAG_TONE } from '@/lib/colors'
import { cn } from '@/lib/utils'

// Import specific interfaces from models for type safety
import type { Education } from '@/models/Education'
import type { Experience, Position } from '@/models/Experience'
import type { Customer } from '@/models/Customer'
import type { Partner } from '@/models/Partner'

// Import data
import experiencesData from '@/data/experiences.json'
import educationData from '@/data/education.json'
import customersData from '@/data/customers.json'
import partnersData from '@/data/partners.json'
import companiesData from '@/data/companies.json'
import type { CompaniesData } from '@/models/Companies'

// Cast companies data to proper type
const companies = companiesData as CompaniesData

// Entity filters shown as chips above the map.
const FILTERS = [
  { id: 'experience', label: 'Experience', count: experiencesData.items.length },
  { id: 'education', label: 'Education', count: educationData.items.length },
  { id: 'customer', label: 'Customers', count: customersData.items.length },
  { id: 'partner', label: 'Partners', count: partnersData.items.length },
] as const

// Fix default markers
delete (L.Icon.Default.prototype as unknown as { _getIconUrl: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})


// Logo pin: a light well outlined in the entity colour; falls back to the type's initial if the logo fails.
const createIcon = (color: string, type: string, logoUrl?: string) => {
  const letter = type.charAt(0).toUpperCase()
  const inner = logoUrl
    ? `<img src="${logoUrl}" alt="" style="width:22px;height:22px;object-fit:contain" onerror="this.style.display='none';this.nextElementSibling.style.display='block';" /><span class="map-pin-letter" style="display:none">${letter}</span>`
    : `<span class="map-pin-letter">${letter}</span>`

  return L.divIcon({
    className: 'map-pin-icon',
    html: `<div class="map-pin" style="--pin-color: ${color}">${inner}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -18],
  })
}

const createIconWithLogo = (type: 'experience' | 'education' | 'customer' | 'partner', logoUrl?: string) =>
  createIcon(ENTITY_HEX_COLORS[type], type, logoUrl)

export interface MapItem {
  uid: string
  type: 'education' | 'experience' | 'customer' | 'partner'
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

const transformPartnerToMapItem = (partner: Partner, index: number): MapItem | null => {
  // Get company data from companyCode
  const company = companies.items.find(c => c.code === partner.companyCode)
  if (!company || !company.coordinates) return null

  return {
    uid: `partner.${partner.partnerCode}.${index}`,
    type: 'partner',
    title: company.title || '',
    coordinate: company.coordinates,
    logoUrl: company.photoUrl,
    category: 'Strategic Partner',
    summarytext: partner.description || `Partnership with ${company.title}`,
    city: company.city || '',
    country: company.country || '',
    daterange: {
      start: '',
      end: undefined
    }
  }
}

// Utility function to create all MapItems from data sources
const createMapItemsFromData = (filters: string[] = ['experience', 'education', 'customer', 'partner']): MapItem[] => {
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

  if (filters.includes('partner')) {
    partnersData.items.forEach((partner, index) => {
      const mapItem = transformPartnerToMapItem(partner as Partner, index)
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
        minWidth={240}
        closeButton={false}
        autoClose={false}
        closeOnEscapeKey={true}
      >
        <div className="flex items-start gap-3">
          {marker.logo && <LogoTile src={marker.logo} alt={marker.title} size={40} variant="logo-light" />}
          <div className="min-w-0">
            <div className="text-sm font-medium leading-snug text-foreground">{marker.title}</div>
            <div className="mt-1.5">
              <Tag tone={ENTITY_TAG_TONE[marker.type]}>{marker.type}</Tag>
            </div>
          </div>
        </div>
        {marker.subtitle && <div className="mt-2.5 text-xs text-muted-foreground">{marker.subtitle}</div>}
        {marker.description && (
          <div className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{marker.description}</div>
        )}
        <div className="type-meta mt-2.5">{[marker.location, marker.period].filter(Boolean).join(' · ')}</div>
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

// Leaflet must recalculate its size when the frame is maximised or restored.
function MapResizer({ trigger }: { trigger: unknown }) {
  const map = useMap()

  useEffect(() => {
    const timeout = window.setTimeout(() => map.invalidateSize(), 80)
    return () => window.clearTimeout(timeout)
  }, [map, trigger])

  return null
}

export default function MapSection() {
  const [selectedFilters, setSelectedFilters] = useState<string[]>(['experience', 'education', 'customer', 'partner'])
  const [viewMode, setViewMode] = useState<'map' | 'grid'>('map')
  const [isMaximized, setIsMaximized] = useState(false)
  const mapRef = useRef<L.Map | null>(null)
  
  // Dialog state management
  const [selectedExperience, setSelectedExperience] = useState<unknown | null>(null)
  const [selectedEducation, setSelectedEducation] = useState<unknown | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<unknown | null>(null)
  const [selectedPartner, setSelectedPartner] = useState<unknown | null>(null)
  const [isExperienceDialogOpen, setIsExperienceDialogOpen] = useState(false)
  const [isEducationDialogOpen, setIsEducationDialogOpen] = useState(false)
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false)
  const [isPartnerDialogOpen, setIsPartnerDialogOpen] = useState(false)

  // While maximised: lock page scroll and restore on Escape.
  useEffect(() => {
    if (!isMaximized) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMaximized(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKey)
    }
  }, [isMaximized])

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

    // Transform Partner data to MapItems
    if (selectedFilters.includes('partner')) {
      partnersData.items.forEach((partner, index) => {
        const mapItem = transformPartnerToMapItem(partner as Partner, index)
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
      } else if (mapItem.type === 'partner') {
        // uid format: partner.{partnerCode}.{index}
        const partnerCode = mapItem.uid.split('.')[1]
        const partner = partnersData.items.find(item => item.partnerCode === partnerCode)
        // For partners, we pass the partner object (not company) so the dialog can access description
        originalData = partner
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
      case 'partner':
        setSelectedPartner(marker.data)
        setIsPartnerDialogOpen(true)
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
    } else if (item.type === 'partner') {
      // uid format: partner.{partnerCode}.{index}
      const partnerCode = item.uid.split('.')[1]
      const partner = partnersData.items.find(p => p.partnerCode === partnerCode)
      // For partners, we pass the partner object (not company) so the dialog can access description
      originalData = partner
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
      case 'partner':
        setSelectedPartner(originalData)
        setIsPartnerDialogOpen(true)
        break
    }
  }

  const maximizeButton = (
    <Button variant="secondary" size="sm" onClick={() => setIsMaximized(!isMaximized)}>
      {isMaximized ? <Minimize2 /> : <Maximize2 />}
      {isMaximized ? 'Minimize' : 'Maximize'}
    </Button>
  )

  return (
    <Section id="map">
      <SectionHeader
        index="09"
        label="footprint"
        title={
          <>
            Where the work has <em>taken me.</em>
          </>
        }
        lede="Explore the worldwide locations of companies I've worked with, institutions where I've studied, and clients I've served throughout my career."
      />

      <Reveal className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <ChipRow aria-label="Show on the map">
          {FILTERS.map((filter) => (
            <Chip
              key={filter.id}
              selected={selectedFilters.includes(filter.id)}
              count={filter.count}
              dotColor={ENTITY_HEX_COLORS[filter.id]}
              onClick={() => toggleFilter(filter.id)}
            >
              {filter.label}
            </Chip>
          ))}
        </ChipRow>
        <SegmentedControl
          ariaLabel="Footprint view"
          value={viewMode}
          onChange={setViewMode}
          options={[
            { value: 'map', label: 'Map view', icon: <MapIcon /> },
            { value: 'grid', label: 'Table view', icon: <Rows3 /> },
          ]}
        />
      </Reveal>

      <Reveal>
        <Surface className={cn('map-frame', isMaximized && 'is-maximized flex flex-col')}>
          {viewMode === 'map' ? (
            <div className={isMaximized ? 'h-full w-full' : 'h-[320px] w-full sm:h-[420px] lg:h-[540px]'}>
              <div className="absolute right-3 top-3 z-[500]">{maximizeButton}</div>
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
                  subdomains="abcd"
                  maxZoom={19}
                  minZoom={2}
                />
                <MapResizer trigger={isMaximized} />
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
            <div className={cn('flex flex-col', isMaximized ? 'h-full' : 'max-h-[540px]')}>
              <div className="flex shrink-0 justify-end border-b border-line p-3">{maximizeButton}</div>
              <div className="min-h-0 flex-1 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date range</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>City</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mapItems.map((item) => {
                      const dateRange = item.daterange.start
                        ? `${item.daterange.start} — ${item.daterange.end || 'present'}`
                        : ''
                      return (
                        <TableRow key={item.uid} className="cursor-pointer" onClick={() => handleRowClick(item)}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <LogoTile src={item.logoUrl} alt={item.title} size={28} variant="logo-light" className="p-[3px]" />
                              <span>{item.title}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Tag tone={ENTITY_TAG_TONE[item.type]}>{item.type}</Tag>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-faint">{dateRange}</TableCell>
                          <TableCell>{item.country}</TableCell>
                          <TableCell>{item.city}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
                {mapItems.length === 0 && (
                  <div className="type-meta p-8 text-center">No items match the selected filters.</div>
                )}
              </div>
            </div>
          )}
        </Surface>
      </Reveal>

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

      <PartnerDetailDialog
        partner={selectedPartner as Partner}
        isOpen={isPartnerDialogOpen}
        onClose={() => {
          setIsPartnerDialogOpen(false)
          setSelectedPartner(null)
        }}
        partnerLogo={
          (selectedPartner as Partner)?.companyCode
            ? companies.items.find((c) => c.code === (selectedPartner as Partner).companyCode)?.photoUrl
            : undefined
        }
        companyTitle={
          (selectedPartner as Partner)?.companyCode
            ? companies.items.find((c) => c.code === (selectedPartner as Partner).companyCode)?.title
            : undefined
        }
      />
    </Section>
  )
}