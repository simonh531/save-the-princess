import { Object3D, Vector3 } from 'three';

export interface WindowSize {
  width: number | undefined
  height: number | undefined
}

export interface MousePosition {
  mouseX: number | undefined
  mouseY: number | undefined
}

export interface MeshData {
  file: string
  geometry: string
  height: number
  cameraAdjustment?: number[]
}

export interface LocationEntity {
  meshId: string
  x: number
  y?: number
  z: number
  activate?: string | (() => void)
  visible?: () => boolean
}

export interface GameEntity {
  mesh: Object3D
  getPosition: () => Vector3
  activate?: string | (() => void)
  getVisibility?: () => boolean
  cameraAdjustment?: number[]
}

export interface Tile {
  url: string
  colors?: number[]
  geometry?: string
  repeat?: number
}

export interface Plane {
  plan: string
  tiles: Record<string, Tile>
}

export interface Location {
  background: string
  groundLightTexture: string
  skyLightTexture: string
  walls: Plane
  horizontalPlanes: Plane[]
  entities?: Record<string, LocationEntity>
}

export interface Dialogue {
  text: (() => string) | string
  speaker?: string
  next?: string
  nextAction?: () => void
  effect?: () => void
  actions?: Array<(() => void) | string>
  choice?: Record<string, (() => void) | string>
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
