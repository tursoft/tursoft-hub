/**
 * Types and labels shared by the map section and the lazily loaded Leaflet canvas.
 * Kept apart from MapCanvas so importing them does not pull Leaflet into the page chunk.
 */
export type MapItemType = 'experience' | 'education' | 'customer' | 'partner'

export const MAP_TYPE_LABEL: Record<MapItemType, string> = {
  experience: 'Experience',
  education: 'Education',
  customer: 'Customer',
  partner: 'Partner',
}

export interface MapMarker {
  id: string
  position: [number, number]
  type: MapItemType
  title: string
  subtitle?: string
  description: string
  location: string
  city?: string
  country?: string
  period?: string
  technologies?: string[]
  logo?: string
  /** Ankara, where he is based: the place drawn in red */
  home?: boolean
  data: unknown // Store the full data object for dialog display
}
