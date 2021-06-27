import { DefaultTheme } from 'styled-components';
import { InstancedMesh, Mesh, Vector3 } from 'three';

export type activateable = string | { focusId: string, dialogueId: string } | (() => void)

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
  cameraAdjustment?: Vector3
}

export interface LocationEntity {
  meshId: string
  x: number
  y?: number
  z: number
  focusPositionId?: string
  activate?: activateable
  visible?: () => boolean
}

export interface GameEntity {
  mesh: Mesh
  getPosition: () => Vector3
  activate?: activateable
  getVisibility?: () => boolean
}

export interface Tile {
  url: string
  colors?: number[]
  geometry?: string
  repeat?: number
  clearcoat?: number
  roughness?: number
}

export interface Plane {
  plan: string
  tiles: Record<string, Tile>
}

export interface Location {
  background: string
  groundLight: string | number
  skyLight: string | number
  mapWidth: number
  mapDepth: number
  cameraX: number
  cameraZ: number
  cameraAngle?: Vector3
  cameraHorizontalRange?: number
  cameraVerticalRange?: number
  direction: number
  walls?: Plane
  horizontalPlanes: Plane[]
  focusPositions?: Record<string, Vector3>
  entities?: LocationEntity[]
}

export interface Dialogue {
  text: (() => string) | string
  speaker?: string
  speakerFocusPositionId?: string
  next?: activateable
  nextText?: string
  effect?: () => void
  actions?: activateable[]
  choice?: Record<string, activateable>
  topic?: Record<string, activateable>
  item?: Record<string, activateable>
}

export interface DialogueData extends Dialogue {
  id: string
  nextText: string
  speaker: string
  isSpeech: boolean
  theme: DefaultTheme
}

export interface Topic {
  name: string,
  description: (() => string) | string,
  actions?: activateable[]
}

export interface Item {
  name: string,
  description: (() => string) | string,
  actions?: activateable[]
}

export interface Skill {
  name: string
}

export interface StateItem {
  id: string
  quantity: number
}

export interface CompressedFilteredBackground {
  original: string
  sunset: string
  night: string
  width: number
  height: number
}

export interface FilteredBackground {
  original: Uint8ClampedArray
  sunset: Uint8ClampedArray
  night: Uint8ClampedArray
  width: number
  height: number
}

export interface LookupTable {
  array: number[][][][],
  type: string
  indices?: number[],
}

export interface ScaledInstancedMesh {
  mesh: InstancedMesh,
  scale?: number
}
