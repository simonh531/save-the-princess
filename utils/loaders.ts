/* eslint-disable no-param-reassign */
import {
  MeshBasicMaterial,
  Mesh,
  PlaneGeometry,
  RepeatWrapping,
  TextureLoader,
  Scene,
  Vector3,
  InstancedMesh,
  PerspectiveCamera,
  Object3D,
} from 'three';
import { PNG } from 'pngjs';

import {
  InstancedMeshTypes, WorldObjects, EntityObjects, ActivateList,
} from './interfaces';

import Entities from '../entities';

function average(array:Array<number>) {
  const sum = array.reduce((total, number) => number + total);
  return sum / array.length;
}

export async function loadWalls(
  loader: TextureLoader,
  scene: Scene,
  worldObjects: WorldObjects,
  walls: object,
  wallPlan: string,
  cameraPosition: Vector3,
  camera: PerspectiveCamera,
) {
  const xValues:Array<number> = [];
  const zValues:Array<number> = [];

  const geometry = new PlaneGeometry();
  const wallTypes:InstancedMeshTypes = {};

  const dummy = new Object3D();

  const buffer = await (await fetch(wallPlan)).arrayBuffer();
  new PNG().parse(Buffer.from(buffer), (e, png:PNG) => {
    Object.entries(walls).forEach(([id, url]) => {
      const material = new MeshBasicMaterial({
        map: loader.load(url),
        transparent: true,
      });
      wallTypes[id] = new InstancedMesh(
        geometry, material, png.height * png.width * 3,
      );
      scene.add(wallTypes[id]);
    });

    let instanceIndex: number = 0;
    let index:number = 0;
    for (let i = 0; i < png.height; i += 1) {
      for (let j = 0; j < png.width; j += 1) {
        if (wallTypes[png.data[index]]) {
          dummy.position.set(j - 0.5, 0.5, i);
          dummy.rotation.y = -Math.PI / 2;
          dummy.updateMatrix();
          wallTypes[png.data[index]].setMatrixAt(instanceIndex, dummy.matrix);
          instanceIndex += 1;
        }

        if (wallTypes[png.data[index + 1]]) {
          dummy.position.set(j, 0.5, i + 0.5);
          dummy.rotation.y = 0;
          dummy.updateMatrix();
          wallTypes[png.data[index + 1]].setMatrixAt(instanceIndex, dummy.matrix);
          instanceIndex += 1;
        }

        if (wallTypes[png.data[index + 2]]) {
          dummy.position.set(j + 0.5, 0.5, i);
          dummy.rotation.y = Math.PI / 2;
          dummy.updateMatrix();
          wallTypes[png.data[index + 2]].setMatrixAt(instanceIndex, dummy.matrix);
          instanceIndex += 1;
        }

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
      average(xValues),
      0.5,
      average(zValues),
    );
    camera.position.copy(cameraPosition);
  });
}

export async function loadFloor(
  loader: TextureLoader,
  scene: Scene,
  worldObjects: WorldObjects,
  floor: object,
  floorPlan: string,
) {
  const geometry = new PlaneGeometry();
  const floorTypes:InstancedMeshTypes = {};

  const dummy = new Object3D();

  const buffer = await (await fetch(floorPlan)).arrayBuffer();
  new PNG().parse(Buffer.from(buffer), (e, png:PNG) => {
    Object.entries(floor).forEach(([id, data]) => {
      if (typeof data === 'string') {
        const material = new MeshBasicMaterial({
          map: loader.load(data),
          transparent: true,
        });
        floorTypes[id] = new InstancedMesh(
          geometry, material, png.height * png.width,
        );
        scene.add(floorTypes[id]);
      } else if (typeof data === 'object') {
        const floorMap = loader.load(data.url);
        if (data.repeat) {
          floorMap.wrapS = RepeatWrapping;
          floorMap.wrapT = RepeatWrapping;
          floorMap.repeat.set(data.repeat, data.repeat);
        }
        const material = new MeshBasicMaterial({
          map: floorMap,
          transparent: true,
        });
        floorTypes[id] = new InstancedMesh(
          geometry, material, png.height * png.width,
        );
        scene.add(floorTypes[id]);
      }
    });

    let index:number = 0;
    for (let i = 0; i < png.height; i += 1) {
      for (let j = 0; j < png.width; j += 1) {
        const code = `${
          png.data[index * 4].toString(16)}${
          png.data[index * 4 + 1].toString(16)}${
          png.data[index * 4 + 2].toString(16)
        }`;

        if (floorTypes[code]) {
          dummy.position.set(j, 0, i);
          dummy.rotation.x = -Math.PI / 2;
          dummy.updateMatrix();
          floorTypes[code].setMatrixAt(index, dummy.matrix);
        }

        index += 1;
      }
    }
    Object.values(floorTypes).forEach((floorType) => {
      floorType.instanceMatrix.needsUpdate = true;
    });
  });
}

export async function loadCeiling(
  loader: TextureLoader,
  scene: Scene,
  worldObjects: WorldObjects,
  ceiling: object,
  ceilingPlan: string,
) {
  const geometry = new PlaneGeometry();
  const ceilingTypes:InstancedMeshTypes = {};

  const dummy = new Object3D();

  const buffer = await (await fetch(ceilingPlan)).arrayBuffer();
  new PNG().parse(Buffer.from(buffer), (e, png:PNG) => {
    Object.entries(ceiling).forEach(([id, data]) => {
      if (typeof data === 'string') {
        const material = new MeshBasicMaterial({
          map: loader.load(data),
          transparent: true,
        });
        ceilingTypes[id] = new InstancedMesh(
          geometry, material, png.height * png.width,
        );
        scene.add(ceilingTypes[id]);
      } else if (typeof data === 'object') {
        const ceilingMap = loader.load(data.url);
        if (data.repeat) {
          ceilingMap.wrapS = RepeatWrapping;
          ceilingMap.wrapT = RepeatWrapping;
          ceilingMap.repeat.set(data.repeat, data.repeat);
        }
        const material = new MeshBasicMaterial({
          map: ceilingMap,
          transparent: true,
        });
        ceilingTypes[id] = new InstancedMesh(
          geometry, material, png.height * png.width,
        );
        scene.add(ceilingTypes[id]);
      }
    });

    let index:number = 0;
    for (let i = 0; i < png.height; i += 1) {
      for (let j = 0; j < png.width; j += 1) {
        const code = `${
          png.data[index * 4].toString(16)}${
          png.data[index * 4 + 1].toString(16)}${
          png.data[index * 4 + 2].toString(16)
        }`;

        if (ceilingTypes[code]) {
          dummy.position.set(j, 1, i);
          dummy.rotation.x = Math.PI / 2;
          dummy.updateMatrix();
          ceilingTypes[code].setMatrixAt(index, dummy.matrix);
        }

        index += 1;
      }
    }
    Object.values(ceilingTypes).forEach((ceilingType) => {
      ceilingType.instanceMatrix.needsUpdate = true;
    });
  });
}

export async function loadEntities(
  loader: TextureLoader,
  scene: Scene,
  entityObjects: WorldObjects,
  clickables: WorldObjects,
  activates: ActivateList,
  entities: EntityObjects,
) {
  Object.entries(entities).forEach(([id, entity]) => {
    const entityData = Entities[entity.entityId];
    const texture = loader.load(entityData.file, () => {
      const geometry = new PlaneGeometry(
        (entityData.height * texture.image.width) / texture.image.height,
        entityData.height,
      );
      const material = new MeshBasicMaterial({
        map: texture,
        transparent: true,
      });
      const entityMesh = new Mesh(geometry, material);
      entityMesh.name = id;
      entityMesh.position.set(entity.x, entityData.height / 2, entity.z);
      scene.add(entityMesh);
      entityObjects[id] = entityMesh;
      if (entity.clickable) {
        clickables[id] = entityMesh;
        activates[id] = entityData.activate;
      }
    });
  });
}
