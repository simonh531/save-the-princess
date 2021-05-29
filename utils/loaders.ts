/* eslint-disable no-param-reassign */
import {
  MeshStandardMaterial,
  Mesh,
  BoxGeometry,
  ExtrudeGeometry,
  RepeatWrapping,
  TextureLoader,
  Scene,
  Vector3,
  InstancedMesh,
  PerspectiveCamera,
  Object3D,
  HemisphereLight,
  AmbientLight,
  Color,
  DirectionalLight,
  Euler,
} from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader';

import { PNG } from 'pngjs';
import FastAverageColor from 'fast-average-color';

import {
  InstancedMeshTypes, WorldObjects, EntityObjects, ActivateList, planeList,
} from './interfaces';

import Entities from '../entities';

function average(array:Array<number>) {
  const sum = array.reduce((total, number) => number + total);
  return sum / array.length;
}

// units are meters let's say
const depth = 0.1;
const cubeUnit = 3;

export async function loadWalls(
  loader: TextureLoader,
  scene: Scene,
  walls: planeList,
  wallPlan: string,
  cameraPosition: Vector3,
  camera: PerspectiveCamera,
  light: DirectionalLight,
  center: Vector3,
): Promise<void> {
  const xValues:Array<number> = [];
  const zValues:Array<number> = [];
  const wallTypes:InstancedMeshTypes = {};
  const dummy = new Object3D();

  const buffer = await (await fetch(wallPlan)).arrayBuffer();
  new PNG().parse(Buffer.from(buffer), async (e, png:PNG) => {
    scene.add(light.target);
    center.x = (png.width * cubeUnit) / 2;
    center.z = (png.height * cubeUnit) / 2;
    light.shadow.camera.top = (png.height * cubeUnit) / 2;
    light.shadow.camera.right = (png.width * cubeUnit) / 2;
    light.shadow.camera.bottom = -(png.height * cubeUnit) / 2;
    light.shadow.camera.left = -(png.width * cubeUnit) / 2;
    // first subtract target position from camera position to keep relative value
    light.position.sub(light.target.position);
    // now set target to 0
    light.target.position.set(0, 0, 0);
    // add center to both
    light.target.position.add(center);
    light.position.add(center);
    light.shadow.camera.updateProjectionMatrix();

    let scale = 0;
    await Promise.all(Object.entries(walls).map(async ([id, plane]) => {
      let wallMap;
      let geometry;
      if (typeof plane === 'object') {
        if (plane.geometry) {
          const svgLoader = new SVGLoader();
          const data = await Promise.all([
            svgLoader.loadAsync(plane.geometry),
            loader.loadAsync(plane.url),
          ]);
          let svgResult;
          [svgResult, wallMap] = data;
          const shape = svgResult.paths[0].toShapes(true);
          geometry = new ExtrudeGeometry(shape, {
            depth,
            bevelThickness: 0,
            bevelSize: -0.001,
          });
          geometry.center();
          let x = 1;
          let y = 1;
          if (geometry.boundingBox) {
            y = geometry.boundingBox.max.y * 2;
            scale = cubeUnit / y;
            x = geometry.boundingBox.max.x * 2;
          }
          wallMap.wrapS = RepeatWrapping;
          wallMap.wrapT = RepeatWrapping;
          wallMap.repeat.set(1 / x, 1 / y);
          wallMap.flipY = false;
        } else {
          wallMap = await loader.loadAsync(plane.url);
          geometry = new BoxGeometry(cubeUnit, cubeUnit, depth);
          if (plane.repeat) {
            wallMap.wrapS = RepeatWrapping;
            wallMap.wrapT = RepeatWrapping;
            wallMap.repeat.set(plane.repeat, plane.repeat);
          }
        }
      } else {
        wallMap = await loader.loadAsync(plane);
        geometry = new BoxGeometry(cubeUnit, cubeUnit, depth);
      }
      const material = new MeshStandardMaterial({
        map: wallMap,
        transparent: typeof plane === 'string' || !plane.geometry,
      });
      wallTypes[id] = new InstancedMesh(
        geometry, material, png.height * png.width * 3,
      );
      wallTypes[id].castShadow = true;
      wallTypes[id].receiveShadow = true;
      scene.add(wallTypes[id]);
    }));

    let instanceIndex = 0;
    let index = 0;
    for (let i = 0; i < png.height; i += 1) {
      for (let j = 0; j < png.width; j += 1) {
        // left wall
        if (wallTypes[png.data[index]]) {
          dummy.position.set(
            j * cubeUnit - ((cubeUnit - depth) / 2),
            cubeUnit / 2,
            i * cubeUnit,
          );
          dummy.rotation.y = -Math.PI / 2;
          if (scale) {
            dummy.scale.copy(new Vector3(scale, -scale, -1));
          } else {
            dummy.scale.copy(new Vector3(1, 1, 1));
          }
          dummy.updateMatrix();
          wallTypes[png.data[index]].setMatrixAt(instanceIndex, dummy.matrix);
          instanceIndex += 1;
        }
        // bottom wall
        if (wallTypes[png.data[index + 1]]) {
          dummy.position.set(
            j * cubeUnit,
            cubeUnit / 2,
            i * cubeUnit + ((cubeUnit - depth) / 2),
          );
          dummy.rotation.y = 0;
          if (scale) {
            dummy.scale.copy(new Vector3(scale, -scale, -1));
          } else {
            dummy.scale.copy(new Vector3(1, 1, 1));
          }
          dummy.updateMatrix();
          wallTypes[png.data[index + 1]].setMatrixAt(instanceIndex, dummy.matrix);
          instanceIndex += 1;
        }
        // right wall
        if (wallTypes[png.data[index + 2]]) {
          dummy.position.set(
            j * cubeUnit + ((cubeUnit - depth) / 2),
            cubeUnit / 2,
            i * cubeUnit,
          );
          dummy.rotation.y = Math.PI / 2;
          if (scale) {
            dummy.scale.copy(new Vector3(scale, -scale, -1));
          } else {
            dummy.scale.copy(new Vector3(1, 1, 1));
          }
          dummy.updateMatrix();
          wallTypes[png.data[index + 2]].setMatrixAt(instanceIndex, dummy.matrix);
          instanceIndex += 1;
        }
        // camera location
        if (png.data[index + 3] === 0) {
          xValues.push(j);
          zValues.push(i);
        }
        index += 4;
      }
    }
    Object.values(wallTypes).forEach((wallType) => {
      wallType.instanceMatrix.needsUpdate = true;
    });
    cameraPosition.set(
      average(xValues) * cubeUnit,
      1.5,
      average(zValues) * cubeUnit,
    );
    camera.position.copy(cameraPosition);
  });
}

export async function loadPlane(
  loader: TextureLoader,
  scene: Scene,
  planes: planeList,
  plan: string,
  height: number,
  unit: number,
  rotation: Euler,
  castShadow: boolean,
  receiveShadow: boolean,
): Promise<void> {
  const geometry = new BoxGeometry(cubeUnit, cubeUnit, depth);
  const planeTypes:InstancedMeshTypes = {};
  const dummy = new Object3D();
  const buffer = await (await fetch(plan)).arrayBuffer();
  new PNG().parse(Buffer.from(buffer), (e, png:PNG) => {
    Object.entries(planes).forEach(([id, plane]) => {
      let planeMap;
      if (typeof plane === 'object') {
        planeMap = loader.load(plane.url);
        if (plane.repeat) {
          planeMap.wrapS = RepeatWrapping;
          planeMap.wrapT = RepeatWrapping;
          planeMap.repeat.set(plane.repeat, plane.repeat);
        }
      } else {
        planeMap = loader.load(plane);
      }
      const material = new MeshStandardMaterial({
        map: planeMap,
        transparent: true,
      });
      planeTypes[id] = new InstancedMesh(
        geometry, material, png.height * png.width,
      );
      planeTypes[id].castShadow = castShadow;
      planeTypes[id].receiveShadow = receiveShadow;
      scene.add(planeTypes[id]);
    });

    let index = 0;
    for (let i = 0; i < png.height; i += 1) {
      for (let j = 0; j < png.width; j += 1) {
        const code = `${
          png.data[index * 4].toString(16)}${
          png.data[index * 4 + 1].toString(16)}${
          png.data[index * 4 + 2].toString(16)
        }`;

        if (planeTypes[code]) {
          dummy.position.set(j * unit, height, i * unit);
          dummy.rotation.copy(rotation);
          dummy.updateMatrix();
          planeTypes[code].setMatrixAt(index, dummy.matrix);
        }

        index += 1;
      }
    }
    Object.values(planeTypes).forEach((planeType) => {
      planeType.instanceMatrix.needsUpdate = true;
    });
  });
}

export function loadEntities(
  loader: TextureLoader,
  scene: Scene,
  entityObjects: WorldObjects,
  clickables: WorldObjects,
  activates: ActivateList,
  entities: EntityObjects,
): void {
  const svgLoader = new SVGLoader();
  Object.entries(entities).forEach(async ([id, entity]) => {
    const entityData = Entities[entity.entityId];
    const [data, texture] = await Promise.all([
      svgLoader.loadAsync(entityData.geometry),
      loader.loadAsync(entityData.file),
    ]);
    const shape = data.paths[0].toShapes(false);
    const geometry = new ExtrudeGeometry(shape, { depth, bevelEnabled: false });
    geometry.center();
    let scale = 0;
    let x = 1;
    let y = 1;
    if (geometry.boundingBox) {
      y = geometry.boundingBox.max.y * 2;
      scale = entityData.height / y;
      x = geometry.boundingBox.max.x * 2;
    }
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(1 / x, 1 / y);
    texture.flipY = false;
    const material = new MeshStandardMaterial({
      map: texture,
    });
    const entityMesh = new Mesh(geometry, material);
    entityMesh.scale.copy(new Vector3(scale, -scale, -0.1));
    entityMesh.castShadow = true;
    entityMesh.receiveShadow = true;
    entityMesh.name = id;
    entityMesh.position.set(entity.x * cubeUnit, entityData.height / 2, entity.z * cubeUnit);
    scene.add(entityMesh);
    entityObjects[id] = entityMesh;
    if (entity.clickable) {
      clickables[id] = entityMesh;
      activates[id] = entityData.activate;
    }
  });
}

export async function loadAmbientLights(
  scene: Scene,
  floor: planeList,
  // floorPlan: string,
  ceiling: planeList,
  // ceilingPlan: string,
  background: string,
  ambientLight: AmbientLight,
  hemisphereLight: HemisphereLight,
): Promise<void> {
  const fac = new FastAverageColor();
  let floorUri:string;
  const firstFloor = Object.values(floor)[0];
  if (typeof firstFloor === 'object') {
    floorUri = firstFloor.url;
  } else {
    floorUri = firstFloor;
  }

  let ceilingUri:string;
  const firstCeiling = Object.values(ceiling)[0];
  if (typeof firstCeiling === 'object') {
    ceilingUri = firstCeiling.url;
  } else {
    ceilingUri = firstCeiling;
  }
  const [ceilingColor, floorColor, backgroundColor] = await Promise.all([
    fac.getColorAsync(ceilingUri),
    fac.getColorAsync(floorUri),
    fac.getColorAsync(background),
  ]);
  hemisphereLight.color = new Color(ceilingColor.rgb);
  hemisphereLight.groundColor = new Color(floorColor.rgb);
  ambientLight.color = new Color(backgroundColor.rgb);
  scene.add(hemisphereLight);
  scene.add(ambientLight);
}
