import { PNG } from 'pngjs';
import {
  BoxGeometry, ExtrudeGeometry, InstancedMesh,
  MeshPhysicalMaterial, Object3D, RepeatWrapping, TextureLoader, sRGBEncoding,
} from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader';
import { ScaledInstancedMesh, Tile } from '../utils/interfaces';

async function createInstancedMeshes(
  tile: Tile,
  count: number, // different because is not being set
  castShadow: boolean,
  receiveShadow: boolean,
  depth: number,
  cubeUnit: number,
): Promise<ScaledInstancedMesh> {
  let wallMap;
  let geometry;
  let scale;
  const loader = new TextureLoader();
  if (typeof tile === 'object') {
    if (tile.geometry) {
      const svgLoader = new SVGLoader();
      const promiseData = await Promise.all([
        svgLoader.loadAsync(tile.geometry),
        loader.loadAsync(tile.url),
      ]);
      let svgResult;
      [svgResult, wallMap] = promiseData;
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
      wallMap = await loader.loadAsync(tile.url);
      geometry = new BoxGeometry(cubeUnit, cubeUnit, depth);
      if (tile.repeat) {
        wallMap.wrapS = RepeatWrapping;
        wallMap.wrapT = RepeatWrapping;
        wallMap.repeat.set(tile.repeat, tile.repeat);
      }
    }
  } else {
    wallMap = await loader.loadAsync(tile);
    geometry = new BoxGeometry(cubeUnit, cubeUnit, depth);
  }
  wallMap.encoding = sRGBEncoding;
  let material:MeshPhysicalMaterial | MeshPhysicalMaterial[] = new MeshPhysicalMaterial({
    map: wallMap,
    transparent: typeof tile === 'string' || !tile.geometry,
    envMapIntensity: 0.15,
  });
  if (tile.clearcoat) {
    material.clearcoat = tile.clearcoat;
  }
  if (tile.colors) {
    material = [
      material,
      ...tile.colors.map((color) => new MeshPhysicalMaterial({ color, envMapIntensity: 0.1 })),
    ];
  }
  const mesh = new InstancedMesh(
    geometry, material, count,
  );
  mesh.castShadow = castShadow;
  mesh.receiveShadow = receiveShadow;
  return { mesh, scale };
}

export async function placeInstanceAtDummy(
  index: number,
  dummy: Object3D,
  scaledInstancedMeshPromise: Promise<ScaledInstancedMesh>,
): Promise<void> {
  const scaledInstancedMesh = await scaledInstancedMeshPromise;
  const { scale, mesh } = scaledInstancedMesh;
  if (scale) {
    dummy.scale.set(scale, -scale, -1);
  } else {
    // reset
    dummy.scale.set(1, 1, 1);
  }
  dummy.updateMatrix();
  mesh.setMatrixAt(index, dummy.matrix);
}

export async function loadPlan(url:string): Promise<PNG> {
  const buffer = await (await fetch(url)).arrayBuffer();
  return new Promise<PNG>((resolve) => {
    new PNG().parse(Buffer.from(buffer), (e, pngData:PNG) => {
      resolve(pngData);
    });
  });
}

export default createInstancedMeshes;
