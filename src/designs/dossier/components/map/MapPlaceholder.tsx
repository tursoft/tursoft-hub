import { useMemo } from 'react'
import { Button } from '../ui/button'
import type { MapItem } from './MapSection'

interface MapPlaceholderProps {
  items: MapItem[]
  /** Shows the button that loads the interactive map. */
  onActivate?: () => void
  /** Shown while the map code is downloading. */
  loading?: boolean
}

/**
 * Light stand-in for the Leaflet map, set like the index of an atlas: every country with
 * its cities and the number of places. It is what the prerendered page and crawlers see,
 * and what visitors see until the map loads as they scroll near it.
 */
export default function MapPlaceholder({ items, onActivate, loading = false }: MapPlaceholderProps) {
  const countries = useMemo(() => {
    const byCountry = new Map<string, { cities: Set<string>; places: number }>()
    for (const item of items) {
      const country = item.country || 'Other'
      if (!byCountry.has(country)) byCountry.set(country, { cities: new Set(), places: 0 })
      const entry = byCountry.get(country)!
      entry.places += 1
      if (item.city) entry.cities.add(item.city)
    }
    return [...byCountry.entries()]
      .map(([country, { cities, places }]) => ({ country, places, cities: [...cities].sort() }))
      .sort((a, b) => b.cities.length - a.cities.length || a.country.localeCompare(b.country))
  }, [items])

  return (
    <div className="flex h-full w-full flex-col overflow-auto p-6 md:p-8">
      <p className="text-[13px] leading-5 text-faint tabular-nums">
        {items.length} locations in {countries.length} countries
      </p>
      <ul
        className="mt-4 columns-1 gap-x-12 border-t border-border sm:columns-2 lg:columns-3"
        aria-label="Countries and cities"
      >
        {countries.map(({ country, cities, places }) => (
          <li key={country} className="break-inside-avoid border-b border-border py-3">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-sm font-medium leading-5 text-foreground">{country}</span>
              <span className="text-xs leading-4 text-faint tabular-nums">{places}</span>
            </div>
            {cities.length > 0 && (
              <div className="mt-0.5 text-[13px] leading-5 text-muted-foreground">{cities.join(', ')}</div>
            )}
          </li>
        ))}
      </ul>
      {(onActivate || loading) && (
        <div className="mt-auto flex items-center gap-4 pt-6">
          {onActivate && (
            <Button variant="outline" size="sm" onClick={onActivate}>
              Show the interactive map
            </Button>
          )}
          {loading && <p className="text-[13px] leading-5 text-faint">Loading the map…</p>}
        </div>
      )}
    </div>
  )
}
