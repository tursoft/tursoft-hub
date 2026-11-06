import { useMemo } from 'react'
import { Globe2, MapPin } from 'lucide-react'
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
 * Light stand-in for the Leaflet map: the countries and cities of every location.
 * It is what the prerendered page and crawlers see, and what visitors see until the
 * map loads as they scroll near it.
 */
export default function MapPlaceholder({ items, onActivate, loading = false }: MapPlaceholderProps) {
  const countries = useMemo(() => {
    const byCountry = new Map<string, Set<string>>()
    for (const item of items) {
      const country = item.country || 'Other'
      if (!byCountry.has(country)) byCountry.set(country, new Set())
      if (item.city) byCountry.get(country)!.add(item.city)
    }
    return [...byCountry.entries()]
      .map(([country, cities]) => ({ country, cities: [...cities].sort() }))
      .sort((a, b) => b.cities.length - a.cities.length || a.country.localeCompare(b.country))
  }, [items])

  return (
    <div className="h-full w-full overflow-auto bg-secondary/30 p-6 flex flex-col items-center justify-center gap-6 text-center">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Globe2 className="h-6 w-6 text-primary" aria-hidden="true" />
        <p className="text-sm">
          {items.length} locations in {countries.length} countries
        </p>
      </div>
      <ul className="flex flex-wrap justify-center gap-2 max-w-3xl" aria-label="Countries and cities">
        {countries.map(({ country, cities }) => (
          <li
            key={country}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/70 px-3 py-1 text-xs text-foreground"
          >
            <MapPin className="h-3 w-3 text-primary" aria-hidden="true" />
            <span className="font-medium">{country}</span>
            {cities.length > 0 && <span className="text-muted-foreground">· {cities.join(', ')}</span>}
          </li>
        ))}
      </ul>
      {onActivate && (
        <Button variant="outline" size="sm" onClick={onActivate}>
          Show the interactive map
        </Button>
      )}
      {loading && <p className="text-xs text-muted-foreground">Loading the map…</p>}
    </div>
  )
}
