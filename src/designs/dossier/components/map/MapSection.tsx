import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '../ui/button'
import { LogoPlate } from '../ui/logo-plate'
import SectionHeader from '../SectionHeader'
import { Map as MapIcon, Table2, Maximize2, Minimize2 } from 'lucide-react'
import ExperienceDetailDialog from '../experiences/ExperienceDetailDialog'
import EducationDetailDialog from '../educations/EducationDetailDialog'
import CustomerDetailDialog from '../customers/CustomerDetailDialog'
import PartnerDetailDialog from '../partners/PartnerDetailDialog'
import MapPlaceholder from './MapPlaceholder'
import { MAP_TYPE_LABEL, type MapItemType, type MapMarker } from './mapTypes'
import { isPrerender } from '@/lib/prerender'
import { parseDate } from '@/lib/datetimeutils'
import { PERSON } from '@/lib/site'
import { cn } from '@/lib/utils'

// Leaflet, its CSS and the map tiles load only when the map is about to be seen.
const MapCanvas = lazy(() => import('./MapCanvas'))

// Import specific interfaces from models for type safety
import type { Education } from '@/models/Education'
import type { Experience } from '@/models/Experience'
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
  type: MapItemType
  title: string
  coordinate: { lat: number; lng: number }
  logoUrl?: string
  category: string
  summarytext: string
  city: string
  country: string
  daterange: { start: string; end?: string }
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "01.05.2026" becomes "May 2026"; anything unparseable is shown as it is. */
const formatMonth = (value?: string | null): string => {
  if (!value) return ''
  const date = parseDate(value)
  return date ? `${MONTHS[date.getMonth()]} ${date.getFullYear()}` : value
}

/** "May 2026 – present", or an empty string when the place has no dates. */
const formatPeriod = ({ start, end }: MapItem['daterange']): string => {
  const from = formatMonth(start)
  if (!from) return ''
  return `${from} – ${end ? formatMonth(end) : 'present'}`
}

const startTime = (value?: string | null) => parseDate(value)?.getTime() ?? 0

// Helper functions to transform data into MapItem objects
const transformExperienceToMapItem = (experience: Experience, index: number): MapItem | null => {
  // Get company data from companyCode
  const company = companies.items.find(c => c.code === experience.companyCode)
  if (!company || !company.coordinates) return null

  // The latest position names the place; copy before sorting so the data stays untouched.
  const latestPosition = [...(experience.positions ?? [])].sort(
    (a, b) => startTime(b.startDate) - startTime(a.startDate)
  )[0]

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
      start: school.datePeriod?.startDate || school.period?.split(' - ')[0] || '',
      end: school.datePeriod?.endDate || school.period?.split(' - ')[1]
    }
  }
}

const transformCustomerToMapItem = (customer: Customer, index: number): MapItem | null => {
  // Get company data from companyCode
  const company = companies.items.find(c => c.code === customer.companyCode)
  if (!company || !company.coordinates) return null

  // The mark sits at the company's coordinates, so its city and country name the place;
  // the free-form location ("Cincinnati, Ohio, USA", "Eastern USA") is the fallback.
  const locationParts = customer.location?.split(',').map(s => s.trim()) || []
  const city = company.city || locationParts[0]
  const country = company.country || locationParts[locationParts.length - 1]

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

// Every place from the data sources, in category order
const createMapItemsFromData = (): MapItem[] => {
  const result: MapItem[] = []

  experiencesData.items.forEach((company, index) => {
    const mapItem = transformExperienceToMapItem(company as Experience, index)
    if (mapItem) result.push(mapItem)
  })

  educationData.items.forEach((school, index) => {
    const mapItem = transformEducationToMapItem(school as Education, index)
    if (mapItem) result.push(mapItem)
  })

  customersData.items.forEach((customer, index) => {
    const mapItem = transformCustomerToMapItem(customer as Customer, index)
    if (mapItem) result.push(mapItem)
  })

  partnersData.items.forEach((partner, index) => {
    const mapItem = transformPartnerToMapItem(partner as Partner, index)
    if (mapItem) result.push(mapItem)
  })

  return result
}

const ALL_MAP_ITEMS = createMapItemsFromData()
const CITY_COUNT = new Set(ALL_MAP_ITEMS.map((item) => `${item.city}|${item.country}`)).size

// The legend doubles as the filter: one entry and one color per category.
const CATEGORIES: { type: MapItemType; label: string; count: number }[] = (
  [
    { type: 'experience', label: 'Experience' },
    { type: 'education', label: 'Education' },
    { type: 'customer', label: 'Customers' },
    { type: 'partner', label: 'Partners' },
  ] as const
).map((category) => ({
  ...category,
  count: ALL_MAP_ITEMS.filter((item) => item.type === category.type).length,
}))

/** The full record behind a place, for its detail dialog. uid format: {type}.{code}.{index} */
const findOriginalData = (item: MapItem): unknown => {
  const code = item.uid.split('.')[1]
  switch (item.type) {
    case 'experience':
      return experiencesData.items.find((exp) => exp.companyCode === code)
    case 'education':
      return educationData.items.find((edu) => edu.code === code)
    case 'customer':
      return customersData.items.find((cust) => cust.code === code)
    case 'partner':
      // For partners, we pass the partner object (not company) so the dialog can access description
      return partnersData.items.find((p) => p.partnerCode === code)
  }
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

  // Escape leaves the maximized plate
  useEffect(() => {
    if (!isMaximized) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !document.querySelector('[role="dialog"]')) setIsMaximized(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isMaximized])

  // Dialog state management
  const [selectedExperience, setSelectedExperience] = useState<unknown | null>(null)
  const [selectedEducation, setSelectedEducation] = useState<unknown | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<unknown | null>(null)
  const [selectedPartner, setSelectedPartner] = useState<unknown | null>(null)
  const [isExperienceDialogOpen, setIsExperienceDialogOpen] = useState(false)
  const [isEducationDialogOpen, setIsEducationDialogOpen] = useState(false)
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false)
  const [isPartnerDialogOpen, setIsPartnerDialogOpen] = useState(false)

  // The places in the selected categories
  const mapItems = useMemo(
    () => ALL_MAP_ITEMS.filter((item) => selectedFilters.includes(item.type)),
    [selectedFilters]
  )

  // Convert MapItems to MapMarkers for rendering. Places that share a spot are grouped
  // into one numbered mark by the map itself, so every marker keeps its true position.
  const markers = useMemo(
    () =>
      mapItems.map((mapItem): MapMarker => ({
        id: mapItem.uid,
        position: [mapItem.coordinate.lat, mapItem.coordinate.lng],
        type: mapItem.type,
        title: mapItem.title,
        subtitle: mapItem.category,
        description: mapItem.summarytext,
        location: `${mapItem.city}, ${mapItem.country}`,
        city: mapItem.city,
        country: mapItem.country,
        period: formatPeriod(mapItem.daterange) || undefined,
        technologies: [], // Technologies would need to be extracted from original data if needed
        logo: mapItem.logoUrl, // Keep full path as is
        home: mapItem.city === PERSON.location.city,
        data: findOriginalData(mapItem),
      })),
    [mapItems]
  )

  const toggleFilter = (filter: string) => {
    setSelectedFilters(prev =>
      prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    )
  }

  const openRecord = useCallback((type: MapItemType, data: unknown) => {
    switch (type) {
      case 'experience':
        setSelectedExperience(data)
        setIsExperienceDialogOpen(true)
        break
      case 'education':
        setSelectedEducation(data)
        setIsEducationDialogOpen(true)
        break
      case 'customer':
        setSelectedCustomer(data)
        setIsCustomerDialogOpen(true)
        break
      case 'partner':
        setSelectedPartner(data)
        setIsPartnerDialogOpen(true)
        break
    }
  }, [])

  // Handle marker click to open appropriate dialog
  const handleMarkerClick = useCallback((marker: MapMarker) => openRecord(marker.type, marker.data), [openRecord])

  // Handle table row click to open appropriate dialog
  const handleRowClick = (item: MapItem) => openRecord(item.type, findOriginalData(item))

  const viewModes = [
    { value: 'map', label: 'Map', icon: MapIcon },
    { value: 'grid', label: 'Table', icon: Table2 },
  ] as const

  return (
    <section id="map" className="places py-16 lg:py-24">
      <div className="container">
        <SectionHeader
          id="map"
          title="Projects in 14 countries"
          description="The companies I've worked with, the institutions where I've studied and the clients and partners I've served, placed on the map."
          aside={
            <>
              <span className="tabular-nums">
                {ALL_MAP_ITEMS.length} places in {CITY_COUNT} cities
              </span>
              <div className="pl-seg" role="group" aria-label="View">
                {viewModes.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    className="pl-seg-btn"
                    aria-pressed={viewMode === value}
                    onClick={() => setViewMode(value)}
                  >
                    <Icon strokeWidth={1.5} aria-hidden="true" />
                    {label}
                  </button>
                ))}
              </div>
            </>
          }
        />

        {/* Legend and filter in one: each category switches on and off */}
        <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-2">
          <div className="-ml-2 flex flex-wrap items-center gap-x-1 gap-y-1" role="group" aria-label="Categories on the map">
            {CATEGORIES.map(({ type, label, count }) => (
              <button
                key={type}
                type="button"
                className="map-key"
                data-cat={type}
                aria-pressed={selectedFilters.includes(type)}
                onClick={() => toggleFilter(type)}
              >
                <span className="cat-dot" aria-hidden="true" />
                {label}
                <span className="text-faint tabular-nums">{count}</span>
              </button>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMaximized(true)}
            className="ml-auto h-8 px-2 text-[13px]"
          >
            <Maximize2 strokeWidth={1.5} aria-hidden="true" />
            Maximize
          </Button>
        </div>

        {/* The plate: the printed map or the table of places */}
        <div className={cn('map-plate', isMaximized && 'is-max')}>
          {isMaximized && (
            <div className="flex h-14 flex-none items-center justify-between gap-4 border-b border-border bg-card px-4 md:px-6">
              <p className="min-w-0 truncate font-serif text-xl leading-7 text-foreground">Projects in 14 countries</p>
              <Button variant="outline" size="sm" onClick={() => setIsMaximized(false)} className="h-8 px-3 text-[13px]">
                <Minimize2 strokeWidth={1.5} aria-hidden="true" />
                Minimize
              </Button>
            </div>
          )}

          {viewMode === 'map' ? (
            <div ref={mapBoxRef} className={isMaximized ? 'min-h-0 w-full flex-1' : 'h-[440px] w-full md:h-[600px]'}>
              {mapActive ? (
                <Suspense fallback={<MapPlaceholder items={mapItems} loading />}>
                  <MapCanvas markers={markers} onMarkerClick={handleMarkerClick} />
                </Suspense>
              ) : (
                <MapPlaceholder items={mapItems} onActivate={() => setMapActive(true)} />
              )}
            </div>
          ) : (
            <div className={isMaximized ? 'min-h-0 flex-1 overflow-auto' : 'max-h-[600px] overflow-auto'}>
              <table className="places-table w-full min-w-[720px] border-collapse">
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Type</th>
                    <th scope="col">Period</th>
                    <th scope="col">Country</th>
                    <th scope="col">City</th>
                  </tr>
                </thead>
                <tbody>
                  {mapItems.map((item) => (
                    <tr
                      key={item.uid}
                      tabIndex={0}
                      onClick={() => handleRowClick(item)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          handleRowClick(item)
                        }
                      }}
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <LogoPlate
                            src={item.logoUrl}
                            alt={`${item.title} logo`}
                            className="h-8 w-8 flex-none p-0.5"
                            fallback={item.title.charAt(0)}
                          />
                          <span className="text-sm leading-5 text-foreground">{item.title}</span>
                        </div>
                      </td>
                      <td>
                        <span className="inline-flex items-center gap-2 whitespace-nowrap" data-cat={item.type}>
                          <span className="cat-dot" aria-hidden="true" />
                          {MAP_TYPE_LABEL[item.type]}
                        </span>
                      </td>
                      <td className="whitespace-nowrap text-faint tabular-nums">{formatPeriod(item.daterange)}</td>
                      <td>{item.country}</td>
                      <td>{item.city}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {mapItems.length === 0 && (
                <p className="p-8 text-center text-sm text-muted-foreground">No places in the selected categories</p>
              )}
            </div>
          )}
        </div>

        {/* Caption under the plate, as under a printed map */}
        {viewMode === 'map' && (
          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] leading-5 text-faint">
            <span className="inline-flex items-center gap-2">
              <span className="map-symbol" aria-hidden="true" />
              Number of places close together
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="map-symbol is-home" aria-hidden="true" />
              {PERSON.location.city}, where I am based
            </span>
          </div>
        )}

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
