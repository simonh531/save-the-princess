export interface WindowSize {
  width: number | undefined
  height: number | undefined
}

export interface MousePosition {
  mouseX: number | undefined
  mouseY: number | undefined
}

export interface Entity {
  file: string
  geometry: string
  height: number
  activate: () => void
}

export interface LocationEntity {
  entityId: string
  x: number
  z: number
  clickable: boolean
}

export interface Tile {
  url: string
  geometry?: string
  repeat?: number
}

export interface Plane {
  plan: string
  tiles: Record<string, Tile>
}

export interface Location {
  background: string
  groundLightTexture: string,
  skyLightTexture: string,
  walls: Plane
  horizontalPlanes: Plane[]
  entities?: Record<string, LocationEntity>
}

export interface Dialogue {
  text: string
  speaker?: string,
  next?: string
  effect?: () => void
  actions?: Array<(() => void) | string>
  topic?: Record<string, (() => void) | string>
  item?: Record<string, (() => void) | string>
}

export interface Topic {
  name: string,
}

export interface Item {
  name: string,
}

export interface BackgroundVersions {
  default: ImageData,
  sunset: ImageData,
  night: ImageData,
}

export interface LookupTable {
  array: number[][][][],
  type: string
  indices?: number[],
}
