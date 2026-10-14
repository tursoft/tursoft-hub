# Task 12: Footprint map restyle

Part of [the Quiet Swiss plan](../2026-10-14-quiet-swiss-redesign.md). Read its **Global Constraints** first.

**Files:**
- Modify: `src/components/map/MapSection.tsx` (presentation only; the data transforms, marker offsets, row/marker click handling and dialogs stay as they are)

**Interfaces:**
- Consumes: Task 1 `ENTITY_HEX_COLORS`, `ENTITY_TAG_TONE`, Leaflet/`map-pin*`/`map-frame` CSS; Task 3 `Reveal`; Task 4 `Button`, `Chip`/`ChipRow`, `LogoTile`, `SegmentedControl`, `Surface`, `Tag`, `Section`, `SectionHeader`, `Table*`.
- Produces: `MapSection` (default, `<section id="map">`), same props (none).

Behaviour changes:
- Dark basemap: CARTO Dark Matter tiles with OpenStreetMap + CARTO attribution.
- Markers: 30px light wells with the logo and a 2px outline in the entity colour (`--pin-color`); hover scales them to 1.18.
- Popups: dark surface, logo on a light well, title, entity tag, subtitle, 3-line description, mono "location · period".
- Filters: four multi-select chips with entity colour swatches and counts. View toggle: segmented control (map / table).
- Maximise: the frame becomes full screen, page scroll is locked, Escape restores it, and the map recalculates its size.
- Table view: restyled table with light logo wells and entity tags.

The file uses no semicolons; keep that style.

---

- [ ] **Step 1: Replace the imports**

Replace everything from the first line of the file down to and including the line `import PartnerDetailDialog from '../partners/PartnerDetailDialog'` with:

```tsx
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
```

- [ ] **Step 2: Delete the injected popup styles**

Delete the comment `// Custom CSS for dark theme popups` and the whole `const darkPopupStyles = \`…\`` template literal that follows it (popup styling now lives in `src/index.css`).

- [ ] **Step 3: Add the filter definitions**

Directly after the line `const companies = companiesData as CompaniesData`, add:

```tsx

// Entity filters shown as chips above the map.
const FILTERS = [
  { id: 'experience', label: 'Experience', count: experiencesData.items.length },
  { id: 'education', label: 'Education', count: educationData.items.length },
  { id: 'customer', label: 'Customers', count: customersData.items.length },
  { id: 'partner', label: 'Partners', count: partnersData.items.length },
] as const
```

- [ ] **Step 4: Replace the marker icon factories**

Replace the two functions `createIcon` and `createIconWithLogo` (from the comment `// Create custom icons for different marker types` through the closing `}` of `createIconWithLogo`) with:

```tsx
// Logo pin: a light well outlined in the entity colour; falls back to the type's initial if the logo fails.
const createIcon = (color: string, type: string, logoUrl?: string) => {
  const letter = type.charAt(0).toUpperCase()
  const inner = logoUrl
    ? `<img src="${logoUrl}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='block';" /><span class="map-pin-letter" style="display:none">${letter}</span>`
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
```

- [ ] **Step 5: Restyle the marker popup**

In `HoverMarker`, replace the whole `<Popup …>…</Popup>` element with:

```tsx
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
```

(Use `div`s, not `p`s: Leaflet's stylesheet adds large margins to `p` inside popups.)

- [ ] **Step 6: Add a size-sync helper for the map**

Directly after the `MapBounds` component (after its final `}`), add:

```tsx

// Leaflet must recalculate its size when the frame is maximised or restored.
function MapResizer({ trigger }: { trigger: unknown }) {
  const map = useMap()

  useEffect(() => {
    const timeout = window.setTimeout(() => map.invalidateSize(), 80)
    return () => window.clearTimeout(timeout)
  }, [map, trigger])

  return null
}
```

- [ ] **Step 7: Replace the style-injection effect with the maximise behaviour**

Inside `MapSection`, replace the block that starts with `  // Inject dark theme styles` and ends with its `  }, [])` with:

```tsx
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
```

- [ ] **Step 8: Replace the rendered markup**

Replace the whole `return ( … )` of `MapSection` (from `  return (` with `<section id="map"` down to the matching `  )` just before the component's final `}`) with:

```tsx
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
```

The commented-out statistics block that sat at the end of the old markup is dropped.

- [ ] **Step 9: Run all quality gates**

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Expected: all pass. If lint reports an unused import or variable from the old markup (e.g. `CountryHighlight` helpers referencing removed imports), remove only that unused name.

- [ ] **Step 10: Visual check**

Screenshot the page and find `#map`: header "09 / footprint"; four chips with coloured square swatches and counts plus the map/table segmented control; a rounded frame with dark map tiles, light logo pins outlined in blue/amber/pink/teal, a "Maximize" button top-right, and the zoom buttons and attribution in the dark style. In a real browser: hovering a pin enlarges it and opens a dark popup; "Maximize" fills the screen and locks page scroll; Escape restores; the table view lists items with light logo wells and entity tags.

- [ ] **Step 11: Commit**

```bash
git add src/components/map/MapSection.tsx
git commit -m "feat(map): dark footprint map with entity-coloured logo pins and chip filters

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
