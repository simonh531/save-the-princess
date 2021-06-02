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
  cameraAdjustment?: number[]
  activate: () => void
}

export interface LocationEntity {
  entityId: string
  x: number
  z: number
  clickable: boolean
  visible?: boolean
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
  getEntities?: () => Record<string, LocationEntity>
}

export interface Theme {
  backgroundColor: string,
  color: string
}

export interface Dialogue {
  text: (() => string) | string
  speaker?: string,
  next?: string
  nextAction?: () => void
  effect?: () => void
  actions?: Array<(() => void) | string>
  topic?: Record<string, (() => void) | string>
  item?: Record<string, (() => void) | string>
}

export interface Topic {
  name: string,
  description: (() => string) | string,
  actions?: Array<(() => void) | string>
}

export interface Item {
  name: string,
  description: (() => string) | string,
  actions?: Array<(() => void) | string>
}

export interface Skill {
  name: string
}

export interface StateItem {
  id: string
  quantity: number
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
