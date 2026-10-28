import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Map, Grid, Maximize2, Minimize2, Briefcase, GraduationCap, Users, Handshake } from 'lucide-react'
import ExperienceDetailDialog from '../experiences/ExperienceDetailDialog'
import EducationDetailDialog from '../educations/EducationDetailDialog'
import CustomerDetailDialog from '../customers/CustomerDetailDialog'
import PartnerDetailDialog from '../partners/PartnerDetailDialog'
import MapPlaceholder from './MapPlaceholder'
import type { MapMarker } from './MapCanvas'
import { isPrerender } from '@/lib/prerender'

// Leaflet, its CSS and the map tiles load only when the map is about to be seen.
const MapCanvas = lazy(() => import('./MapCanvas'))

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

export default function MapSection() {
  const [selectedFilters, setSelectedFilters] = useState<string[]>(['experience', 'education', 'customer', 'partner'])
  const [viewMode, setViewMode] = useState<'map' | 'grid'>('map')
  const [isMaximized, setIsMaximized] = useState(false)
  // The interactive map mounts when its box nears the viewport (never during prerender);
  // until then a light list of locations stands in, which also gives crawlers the places.
  const [mapActive, setMapActive] = useState(false)
  const mapBoxRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (isPrerender || mapActive) return
    const el = mapBoxRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setMapActive(true)
          io.disconnect()
        }
      },
      { rootMargin: '400px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [mapActive, viewMode])
  
  // Dialog state management
  const [selectedExperience, setSelectedExperience] = useState<unknown | null>(null)
  const [selectedEducation, setSelectedEducation] = useState<unknown | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<unknown | null>(null)
  const [selectedPartner, setSelectedPartner] = useState<unknown | null>(null)
  const [isExperienceDialogOpen, setIsExperienceDialogOpen] = useState(false)
  const [isEducationDialogOpen, setIsEducationDialogOpen] = useState(false)
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false)
  const [isPartnerDialogOpen, setIsPartnerDialogOpen] = useState(false)


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

  return (
    <section id="map" className="py-20 bg-gradient-to-b from-background via-secondary/50 to-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 border-primary/40 text-primary uppercase tracking-widest">Global Presence</Badge>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Global Footprint:
            <span className="bg-gradient-to-r from-[hsl(var(--navy-deep))] via-[hsl(var(--primary))] to-[hsl(var(--primary-light))] bg-clip-text text-transparent block lg:inline lg:ml-4">Projects in 14 Countries</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Explore the worldwide locations of companies I've worked with, institutions where I've studied, 
            and clients I've served throughout my career.
          </p>
        </div>

        {/* Combined Filters and View Mode Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          {/* Category Filters - Left Side */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => toggleFilter('experience')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                selectedFilters.includes('experience')
                  ? 'bg-blue-500 text-white'
                  : 'bg-secondary text-muted-foreground hover:bg-blue-100'
              }`}
            >
              <Briefcase className="w-4 h-4" />
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
              <GraduationCap className="w-4 h-4" />
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
              <Users className="w-4 h-4" />
              Customers ({customersData.items.length})
            </button>
            <button
              onClick={() => toggleFilter('partner')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                selectedFilters.includes('partner')
                  ? 'bg-orange-500 text-white'
                  : 'bg-secondary text-muted-foreground hover:bg-orange-100'
              }`}
            >
              <Handshake className="w-4 h-4" />
              Partners ({partnersData.items.length})
            </button>
          </div>

          {/* View Mode Toggle - Right Side */}
          <TooltipProvider>
            <div className="flex bg-secondary rounded-lg p-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === 'map' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('map')}
                    aria-label="Map view"
                    aria-pressed={viewMode === 'map'}
                    className="flex items-center"
                  >
                    <Map className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Map View</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    aria-label="Grid view"
                    aria-pressed={viewMode === 'grid'}
                    className="flex items-center"
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Grid View</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>

        {/* Map or Grid View */}
        <Card className={`overflow-hidden relative ${isMaximized ? 'fixed inset-0 z-50 rounded-none' : ''}`}>
          {/* Maximize/Minimize Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMaximized(!isMaximized)}
            className="absolute top-4 right-4 z-10 bg-background/80 backdrop-blur-sm hover:bg-background"
          >
            {isMaximized ? (
              <>
                <Minimize2 className="w-4 h-4 mr-2" />
                Minimize
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4 mr-2" />
                Maximize
              </>
            )}
          </Button>
          
          {viewMode === 'map' ? (
            <div ref={mapBoxRef} className={isMaximized ? 'h-screen w-full' : 'h-[600px] w-full'}>
              {mapActive ? (
                <Suspense fallback={<MapPlaceholder items={mapItems} loading />}>
                  <MapCanvas markers={markers} onMarkerClick={handleMarkerClick} />
                </Suspense>
              ) : (
                <MapPlaceholder items={mapItems} onActivate={() => setMapActive(true)} />
              )}
            </div>
          ) : (
            <div className={isMaximized ? 'h-screen overflow-auto' : 'max-h-[600px] overflow-auto'}>
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
                      customer: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
                      partner: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
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
                              <img loading="lazy" decoding="async" 
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
        {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-500 mb-2">{experiencesData.items.length}</div>
            <div className="text-muted-foreground">Companies Worked With</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">{educationData.items.length}</div>
            <div className="text-muted-foreground">Educational Institutions</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-red-600 mb-2">
              {customersData.items.length}
            </div>
            <div className="text-muted-foreground">Clients Served</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-orange-500 mb-2">
              {partnersData.items.length}
            </div>
            <div className="text-muted-foreground">Strategic Partners</div>
          </Card>
        </div> */}

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
        
        <PartnerDetailDialog
          partner={selectedPartner as Partner}
          isOpen={isPartnerDialogOpen}
          onClose={() => {
            setIsPartnerDialogOpen(false)
            setSelectedPartner(null)
          }}
          partnerLogo={(selectedPartner as Partner)?.companyCode ? companies.items.find(c => c.code === (selectedPartner as Partner).companyCode)?.photoUrl : undefined}
          companyTitle={(selectedPartner as Partner)?.companyCode ? companies.items.find(c => c.code === (selectedPartner as Partner).companyCode)?.title : undefined}
        />
      </div>
    </section>
  )
}