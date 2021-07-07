import { DefaultTheme } from 'styled-components';
import {
  AnimationMixer, Group, InstancedMesh, Vector3,
} from 'three';

export type Activatable = string | { focusId: string, dialogueId: string } | (() => void)
export type Checks = Record<string, string|number|boolean>

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
  alt?: Record<string, {
    file: string
    geometry: string
    height?: number
    cameraAdjustment?: Vector3
  }>
}

export interface LocationEntity {
  meshId: string
  x: number
  y?: number
  z: number
  altId?: string
  activate?: Activatable
  // eslint-disable-next-line no-unused-vars
  visible?: (checks: Checks) => boolean
}

export interface GameEntity {
  group: Group
  altId: string
  mixers: Record<string, AnimationMixer>
  getPosition: () => Vector3
  activate?: Activatable
  // eslint-disable-next-line no-unused-vars
  getVisibility?: (checks: Checks) => boolean
}

export interface Tile {
  map?: string
  color?: number
  depth?: number
  colors?: number[]
  geometry?: string
  repeat?: number
  clearcoat?: number
  roughness?: number
}

export interface Plane {
  plan?: string
  tiles?: Map<string, Tile>
  unit?: number
  aspect?: number // width/height
  clipBelow?: boolean
}

export interface Location {
  background: string
  mapWidth: number
  mapHeight: number
  mapDepth: number
  cameraX: number
  cameraY: number // this position is for the ground
  cameraZ: number
  cameraAngle?: Vector3
  cameraHorizontalRange?: number
  cameraVerticalRange?: number
  direction?: number
  walls?: Plane[]
  horizontalPlanes?: Plane[]
  focusPositions?: Record<string, Vector3>
  entities?: Map<string, LocationEntity>
}

export interface Dialogue {
  text: (() => string) | string
  speaker?: string
  speakerFocusPositionId?: string
  next?: Activatable
  nextText?: string
  effect?: () => void
  actions?: Activatable[]
  choice?: Record<string, Activatable>
  topic?: Record<string, Activatable>
  item?: Record<string, Activatable>
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
  actions?: Activatable[]
}

export interface Item {
  name: string,
  description: (() => string) | string,
  actions?: Activatable[]
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

export interface Command {
  command: string,
  id: string,
}

export interface ChangeMeshCommand extends Command {
  command: 'changeMesh'
  mesh: string
}

export interface CharacterStats {
  eyeHeight: number
  skills: Record<string, number>
}

export interface InstancedMeshData {
  meshData: Promise<{ mesh: InstancedMesh, scale?: number }>,
  depth: number,
}
