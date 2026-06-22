import { create } from 'zustand'

export interface Location {
  lat: number
  lng: number
  name: string
}

export interface SatelliteObject {
  name: string
  id: number
  lat: number
  lng: number
  alt: number  // km
  vel: number  // km/s
  elevation: number  // degrees above horizon
  azimuth: number
  type: 'iss' | 'station' | 'active' | 'debris' | 'weather' | 'navigation'
  country?: string
  tle1: string
  tle2: string
}

export interface PlanetInfo {
  name: string
  elevation: number
  azimuth: number
  magnitude: number
  distance: number // AU
  ra: string
  dec: string
}

export type FilterType = 'iss' | 'active' | 'debris' | 'weather' | 'navigation' | 'planets' | 'constellations'

interface ZenithStore {
  // Location
  location: Location
  setLocation: (loc: Location) => void

  // Time
  currentTime: Date
  timeOffset: number  // hours from now (-12 to +24)
  setTimeOffset: (offset: number) => void

  // Satellites
  satellites: SatelliteObject[]
  setSatellites: (sats: SatelliteObject[]) => void
  selectedObject: SatelliteObject | null
  setSelectedObject: (obj: SatelliteObject | null) => void

  // Planets
  planets: PlanetInfo[]
  setPlanets: (planets: PlanetInfo[]) => void

  // Filters
  activeFilters: Set<FilterType>
  toggleFilter: (filter: FilterType) => void

  // UI
  isLoading: boolean
  setIsLoading: (v: boolean) => void
  showDebrisLens: boolean
  toggleDebrisLens: () => void
  showConstellations: boolean
  toggleConstellations: () => void
  activeView: 'radar' | 'globe' | 'solarsystem'
  setActiveView: (view: 'radar' | 'globe' | 'solarsystem') => void

  // Sky score
  cloudCover: number
  skyScore: number
  setWeather: (cloud: number) => void
}

export const useZenithStore = create<ZenithStore>((set, get) => ({
  location: { lat: 28.6139, lng: 77.2090, name: 'New Delhi, India' },
  setLocation: (loc) => set({ location: loc }),

  currentTime: new Date(),
  timeOffset: 0,
  setTimeOffset: (offset) => set({ timeOffset: offset, currentTime: new Date(Date.now() + offset * 3600000) }),

  satellites: [],
  setSatellites: (sats) => set({ satellites: sats }),
  selectedObject: null,
  setSelectedObject: (obj) => set({ selectedObject: obj }),

  planets: [],
  setPlanets: (planets) => set({ planets }),

  activeFilters: new Set(['iss', 'active', 'planets']),
  toggleFilter: (filter) => {
    const filters = new Set(get().activeFilters)
    if (filters.has(filter)) filters.delete(filter)
    else filters.add(filter)
    set({ activeFilters: filters })
  },

  isLoading: false,
  setIsLoading: (v) => set({ isLoading: v }),
  showDebrisLens: false,
  toggleDebrisLens: () => set((s) => ({ showDebrisLens: !s.showDebrisLens })),
  showConstellations: false,
  toggleConstellations: () => set((s) => ({ showConstellations: !s.showConstellations })),
  activeView: 'radar',
  setActiveView: (view) => set({ activeView: view }),

  cloudCover: 0,
  skyScore: 0,
  setWeather: (cloud) => {
    const bortleBase = 5
    const cloudPenalty = cloud / 20
    const score = Math.max(0, Math.min(10, 10 - bortleBase - cloudPenalty))
    set({ cloudCover: cloud, skyScore: Math.round(score * 10) / 10 })
  },
}))
