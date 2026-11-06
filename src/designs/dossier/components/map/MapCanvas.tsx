/**
 * The interactive Leaflet map. Loaded lazily by MapSection when the map box nears the
 * viewport, so Leaflet, its CSS and the OpenStreetMap tiles stay out of the first load
 * and out of the prerendered HTML.
 *
 * The map is printed into the page (see .map-plate in styles/places.css): greyscale tiles,
 * one category dot per place, and ink discs with a count where places sit close together
 * at the current zoom. The disc that holds Ankara, where he is based, is printed in red.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvent } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { LogoPlate } from '../ui/logo-plate'
import { MAP_TYPE_LABEL, type MapMarker } from './mapTypes'

export type { MapMarker } from './mapTypes'

/** Marks closer than this many pixels at the current zoom share one disc. */
const CLUSTER_RADIUS = 28

/** Keeps the view on the printed world, with no bare paper past the tiles' polar edge. */
const WORLD_BOUNDS: L.LatLngBoundsExpression = [[-85, -540], [85, 540]]

interface Place {
  key: string
  position: L.LatLngExpression
  items: MapMarker[]
  home: boolean
}

/** Groups the markers that would overlap at this zoom; a lone marker is a place of one. */
function groupPlaces(map: L.Map, markers: MapMarker[], zoom: number): Place[] {
  const groups: { x: number; y: number; points: L.Point[]; items: MapMarker[] }[] = []
  for (const marker of markers) {
    const point = map.project(marker.position, zoom)
    const group = groups.find((g) => Math.hypot(g.x - point.x, g.y - point.y) < CLUSTER_RADIUS)
    if (group) {
      group.items.push(marker)
      group.points.push(point)
    } else {
      groups.push({ x: point.x, y: point.y, points: [point], items: [marker] })
    }
  }
  return groups.map((g) => {
    const x = g.points.reduce((sum, p) => sum + p.x, 0) / g.points.length
    const y = g.points.reduce((sum, p) => sum + p.y, 0) / g.points.length
    return {
      key: g.items.map((item) => item.id).join('|'),
      position: g.items.length === 1 ? g.items[0].position : map.unproject([x, y], zoom),
      items: g.items,
      home: g.items.some((item) => item.home),
    }
  })
}

/** "Ankara, Turkey", "Ankara, Istanbul and Kocaeli" or "12 cities" for the sheet heading. */
function placeName(items: MapMarker[]): string {
  const cities = [...new Set(items.map((item) => item.city).filter(Boolean))] as string[]
  const countries = [...new Set(items.map((item) => item.country).filter(Boolean))] as string[]
  if (cities.length === 1) return countries.length === 1 ? `${cities[0]}, ${countries[0]}` : cities[0]
  if (cities.length > 1 && cities.length <= 3) return `${cities.slice(0, -1).join(', ')} and ${cities[cities.length - 1]}`
  if (countries.length === 1) return `${cities.length} cities in ${countries[0]}`
  return `${cities.length} cities`
}

const SHEET_MARGIN = 8

/**
 * Keeps an open sheet inside the plate: it hangs below the mark when there is no room
 * above, shifts sideways near the edges (the tip still points at the mark), and a long
 * list gets shorter when neither side has room for all of it.
 */
function placeSheet(map: L.Map, marker: L.Marker) {
  const popup = marker.getPopup()
  const el = popup?.getElement()
  if (!popup || !el || !marker.isPopupOpen()) return
  const wrapper = el.querySelector<HTMLElement>('.leaflet-popup-content-wrapper')
  const tip = el.querySelector<HTMLElement>('.leaflet-popup-tip-container')
  const list = el.querySelector<HTMLElement>('[data-sheet-list]')
  if (!wrapper) return

  const size = map.getSize()
  const point = map.latLngToContainerPoint(marker.getLatLng())
  const reach = Math.abs(L.point(marker.getIcon().options.popupAnchor ?? [0, -12]).y)
  if (list) list.style.maxHeight = ''

  // Above, the sheet ends 13px over the anchor and its tip fills the gap; below, it starts 8px under the mark
  const spaceAbove = point.y - reach - 13 - SHEET_MARGIN
  const spaceBelow = size.y - point.y - reach - 8 - SHEET_MARGIN
  let height = wrapper.offsetHeight
  const below = height > spaceAbove && spaceBelow > spaceAbove
  const room = below ? spaceBelow : spaceAbove
  if (list && height > room) {
    list.style.maxHeight = `${Math.max(96, list.offsetHeight - (height - room))}px`
    height = wrapper.offsetHeight
  }

  const width = wrapper.offsetWidth
  const left = point.x - width / 2
  let shift = 0
  if (left < SHEET_MARGIN) shift = SHEET_MARGIN - left
  else if (left + width > size.x - SHEET_MARGIN) shift = size.x - SHEET_MARGIN - (left + width)

  el.classList.toggle('is-below', below)
  if (tip) tip.style.marginLeft = `${-20 - shift}px`
  // Leaflet sets the sheet's bottom edge at -offset.y from the anchor, less its 20px margin
  popup.options.offset = below ? L.point(shift, 2 * reach + 28 + height) : L.point(shift, 7)
  popup.update()
}

function clusterSize(count: number): number {
  if (count < 10) return 24
  if (count < 20) return 28
  return 32
}

function createIcon(place: Place): L.DivIcon {
  if (place.items.length === 1) {
    const item = place.items[0]
    return L.divIcon({
      className: 'map-icon',
      html: `<span class="map-mark" data-cat="${item.type}"><span class="map-dot"></span></span>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12],
    })
  }
  const size = clusterSize(place.items.length)
  return L.divIcon({
    className: 'map-icon',
    html: `<span class="map-cluster${place.home ? ' is-home' : ''}" style="--size:${size}px">${place.items.length}</span>`,
    iconSize: [size + 4, size + 4],
    iconAnchor: [(size + 4) / 2, (size + 4) / 2],
    popupAnchor: [0, -(size / 2 + 2)],
  })
}

/** One place on its own: what it is, where, and when. Opens the full record on click. */
function PlaceSheet({ item }: { item: MapMarker }) {
  return (
    <div className="w-[272px] p-4">
      <div className="flex items-start gap-3">
        <LogoPlate src={item.logo} alt={`${item.title} logo`} className="h-10 w-10 flex-none p-1" />
        <div className="min-w-0">
          <div className="text-sm font-medium leading-5 text-foreground">{item.title}</div>
          <div className="mt-0.5 flex items-center gap-2 text-[13px] leading-5 text-muted-foreground" data-cat={item.type}>
            <span className="cat-dot" aria-hidden="true" />
            {MAP_TYPE_LABEL[item.type]}
          </div>
        </div>
      </div>
      {item.subtitle && <div className="mt-3 text-[13px] leading-5 text-foreground">{item.subtitle}</div>}
      {item.description && (
        <div className="mt-1 line-clamp-3 text-[13px] leading-5 text-muted-foreground">{item.description}</div>
      )}
      <div className="mt-3 border-t border-border pt-2 text-xs leading-4 text-faint tabular-nums">
        {item.location}
        {item.period && <span className="whitespace-nowrap"> · {item.period}</span>}
      </div>
    </div>
  )
}

/** Several places under one disc: a short list, each row opens its record. */
function PlaceList({ items, onOpen }: { items: MapMarker[]; onOpen: (item: MapMarker) => void }) {
  return (
    <div className="w-[288px]">
      <div className="flex items-baseline justify-between gap-3 border-b border-border px-4 pb-2 pt-3">
        <span className="min-w-0 truncate text-sm font-medium leading-5 text-foreground">{placeName(items)}</span>
        <span className="flex-none text-xs leading-4 text-faint tabular-nums">{items.length} places</span>
      </div>
      <ul className="max-h-[264px] overflow-y-auto py-1" data-sheet-list="">
        {items.map((item) => (
          <li key={item.id} className="border-t border-border first:border-t-0" data-cat={item.type}>
            <button
              type="button"
              onClick={() => onOpen(item)}
              className="flex w-full items-center gap-3 px-4 py-2 text-left transition-colors duration-150 ease-dossier hover:bg-secondary focus-visible:bg-secondary focus-visible:outline-none"
            >
              <span className="cat-dot" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-[13px] leading-5 text-foreground">{item.title}</span>
              <span className="flex-none text-xs leading-4 text-faint">{MAP_TYPE_LABEL[item.type]}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * A mark with its paper sheet. Hovering shows the sheet and keeps it while the pointer
 * moves onto it; clicking a single place opens its record, clicking a disc pins its list.
 */
function PlaceMark({ place, onOpen }: { place: Place; onOpen: (item: MapMarker) => void }) {
  const map = useMap()
  const markerRef = useRef<L.Marker | null>(null)
  const closeTimer = useRef<number | undefined>(undefined)
  const pinned = useRef(false)
  const isGroup = place.items.length > 1
  const icon = useMemo(() => createIcon(place), [place])

  const cancelClose = useCallback(() => window.clearTimeout(closeTimer.current), [])
  const scheduleClose = useCallback(() => {
    window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => {
      if (!pinned.current) markerRef.current?.closePopup()
    }, 200)
  }, [])

  useEffect(() => () => window.clearTimeout(closeTimer.current), [])

  // The icon is a div; give it a name for screen readers and keyboard users.
  useEffect(() => {
    const label = isGroup
      ? `${place.items.length} places: ${placeName(place.items)}`
      : `${place.items[0].title}, ${MAP_TYPE_LABEL[place.items[0].type].toLowerCase()}, ${place.items[0].location}`
    markerRef.current?.getElement()?.setAttribute('aria-label', label)
  }, [place, isGroup, icon])

  const eventHandlers = useMemo<L.LeafletEventHandlerFnMap>(() => {
    const open = (pin: boolean) => {
      const marker = markerRef.current
      if (!marker) return
      cancelClose()
      pinned.current = pinned.current || pin
      // Hovering must not slide the map away from the pointer; a pinned list may.
      const popup = marker.getPopup()
      if (popup) popup.options.autoPan = pin
      if (!marker.isPopupOpen()) marker.openPopup()
    }
    return {
      mouseover: () => open(false),
      mouseout: scheduleClose,
      click: () => {
        if (isGroup) {
          open(true)
        } else {
          markerRef.current?.closePopup()
          onOpen(place.items[0])
        }
      },
      popupopen: (event) => {
        const marker = markerRef.current
        marker?.getElement()?.classList.add('is-selected')
        const el = (event as L.PopupEvent).popup.getElement()
        el?.addEventListener('mouseenter', cancelClose)
        el?.addEventListener('mouseleave', scheduleClose)
        // react-leaflet renders the sheet into the popup after it opens; place it once drawn
        requestAnimationFrame(() => requestAnimationFrame(() => marker && placeSheet(map, marker)))
      },
      popupclose: (event) => {
        pinned.current = false
        markerRef.current?.getElement()?.classList.remove('is-selected')
        const el = (event as L.PopupEvent).popup.getElement()
        el?.removeEventListener('mouseenter', cancelClose)
        el?.removeEventListener('mouseleave', scheduleClose)
      },
    }
  }, [cancelClose, scheduleClose, isGroup, onOpen, place, map])

  return (
    <Marker
      ref={markerRef}
      position={place.position}
      icon={icon}
      zIndexOffset={place.home ? 1000 : isGroup ? 500 : 0}
      eventHandlers={eventHandlers}
    >
      <Popup maxWidth={320} minWidth={240} closeButton={false} closeOnEscapeKey={true}>
        {isGroup ? (
          <PlaceList
            items={place.items}
            onOpen={(item) => {
              markerRef.current?.closePopup()
              onOpen(item)
            }}
          />
        ) : (
          <PlaceSheet item={place.items[0]} />
        )}
      </Popup>
    </Marker>
  )
}

/** Regroups the marks whenever the zoom changes. */
function PlaceMarks({ markers, onOpen }: { markers: MapMarker[]; onOpen: (item: MapMarker) => void }) {
  const map = useMap()
  const [zoom, setZoom] = useState(() => map.getZoom())
  useMapEvent('zoomend', () => setZoom(map.getZoom()))
  const places = useMemo(() => groupPlaces(map, markers, zoom), [map, markers, zoom])

  return (
    <>
      {places.map((place) => (
        <PlaceMark key={place.key} place={place} onOpen={onOpen} />
      ))}
    </>
  )
}

// Fits the view to the visible marks whenever the filters change.
function MapBounds({ markers }: { markers: MapMarker[] }) {
  const map = useMap()

  useEffect(() => {
    if (!map || !markers || markers.length === 0) return

    // Add a small delay to ensure all markers are rendered
    const timeout = setTimeout(() => {
      try {
        const positions = markers.map((marker) => marker.position)
        if (positions.length > 0) {
          const bounds = L.latLngBounds(positions)
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 6 })
        }
      } catch (error) {
        console.warn('Error fitting map bounds:', error)
      }
    }, 100)

    return () => clearTimeout(timeout)
  }, [markers, map])

  return null
}

// The plate changes size when it is maximized; Leaflet has to measure again.
function MapResize() {
  const map = useMap()

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => map.invalidateSize())
    observer.observe(map.getContainer())
    return () => observer.disconnect()
  }, [map])

  return null
}

export default function MapCanvas({
  markers,
  onMarkerClick,
}: {
  markers: MapMarker[]
  onMarkerClick: (marker: MapMarker) => void
}) {
  // On a phone the plate is too narrow to show every place at zoom 2; allow one step out.
  const [minZoom] = useState(() => (window.innerWidth < 640 ? 1 : 2))

  return (
    <MapContainer
      center={[40, 0]}
      zoom={2}
      minZoom={minZoom}
      maxBounds={WORLD_BOUNDS}
      style={{ height: '100%', width: '100%' }}
      className="z-0"
      scrollWheelZoom={true}
      attributionControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={18}
        minZoom={minZoom}
      />
      {markers.length > 0 && <MapBounds markers={markers} />}
      <MapResize />
      <PlaceMarks markers={markers} onOpen={onMarkerClick} />
    </MapContainer>
  )
}
