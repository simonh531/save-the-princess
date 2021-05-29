import {
  InstancedMesh,
  Object3D,
} from 'three';

export interface WindowSize {
  width: number | undefined
  height: number | undefined
}

export interface MousePosition {
  mouseX: number | undefined
  mouseY: number | undefined
}

export interface InstancedMeshTypes {
  [key: string]: InstancedMesh
}

export interface WorldObjects {
  [key: string]: Object3D
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

export interface EntityObjects {
  [key: string]: LocationEntity
}

export interface ActivateList {
  [key: string]: () => void
}

export interface planeData {
  url: string
  geometry?: string
  repeat?: number
}

export interface planeList {
  [key: string]: string | planeData
}

export interface Location {
  background: string
  wallPlan: string
  floorPlan: string
  ceilingPlan: string
  walls: planeList
  floor: planeList
  ceiling: planeList
  entities: EntityObjects
}

export interface LocationList {
  [key: string]: Location
}

export interface EntityList {
  [key: string]: Entity
}

export interface DialogueInteraction {
  [key: string]: () => void
}

export interface Dialogue {
  text: string
  next?: string
  effect?: () => void
  actions?: Array<() => void>
  topic?: DialogueInteraction
  item?: DialogueInteraction
}

export interface DialogueList {
  [key: string]: Dialogue
}

export interface DialogueMasterList {
  [key: string]: DialogueList
}

export interface BoxStyleList {
  [key: string]: string
}

export interface Topic {
  name: string,
}

export interface TopicList {
  [key: string]: Topic
}

export interface Item {
  name: string,
}

export interface ItemList {
  [key: string]: Item
}

export interface LookupArrayList {
  [key: string]: Array<Array<Array<Array<number>>>>
}
