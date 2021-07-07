import { PNG } from 'pngjs';
import {
  BoxGeometry, ExtrudeGeometry, InstancedMesh,
  MeshPhysicalMaterial, MeshStandardMaterial,
  Object3D, RepeatWrapping, TextureLoader, sRGBEncoding, Texture, Color,
} from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader';
import { Tile } from '../utils/interfaces';

interface SVGXML extends XMLDocument {
  attributes: {
    width: { nodeValue: string }
    height: { nodeValue: string }
  }
}

const defaultSettings = {
  castShadow: false,
  receiveShadow: false,
  unit: 1,
  aspect: 1,
};

async function createInstancedMesh(
  tile: Tile,
  count: number,
  settings: {
    castShadow?: boolean,
    receiveShadow?: boolean,
    unit?: number,
    aspect?: number,
  } = {},
): Promise<{
  mesh: InstancedMesh,
  scale?: number
}> {
  const {
    castShadow, receiveShadow, unit, aspect,
  } = {
    ...defaultSettings,
    ...settings,
  };
  let map:Texture | null;
  let color: Color;
  let geometry;
  let scale;
  const loader = new TextureLoader();
  if (tile.map) {
    map = await loader.loadAsync(tile.map);
    map.encoding = sRGBEncoding;
    map.wrapS = RepeatWrapping;
    map.wrapT = RepeatWrapping;
  } else {
    map = null;
  }
  if (tile.color) {
    color = new Color(tile.color);
  } else {
    color = new Color(0xffffff);
  }
  if (tile.geometry) {
    const svgLoader = new SVGLoader();
    const svgResult = await svgLoader.loadAsync(tile.geometry);
    const shape = svgResult.paths[0].toShapes(true);
    geometry = new ExtrudeGeometry(shape, {
      depth: tile.depth || 0.1,
      bevelThickness: 0,
      bevelSize: -0.001,
    });
    geometry.computeBoundingBox();
    const svgXml:SVGXML = svgResult.xml as SVGXML;
    const x = parseFloat(svgXml.attributes.width.nodeValue);
    const y = parseFloat(svgXml.attributes.height.nodeValue);
    geometry.translate(-x / 2, -y / 2, -(tile.depth || 0.1) / 2);
    scale = unit / aspect / y;
    if (map) {
      map.repeat.set(1 / x, 1 / y);
      map.flipY = false;
    }
  } else {
    geometry = new BoxGeometry(unit, unit / aspect, tile.depth || 0.1);
    if (map && tile.repeat) {
      map.repeat.set(tile.repeat, tile.repeat);
    }
  }
  let material: MeshStandardMaterial | MeshStandardMaterial[];
  const standardSettings = {
    map,
    color,
  };
  if (tile.clearcoat) {
    const physicalSettings = {
      ...standardSettings,
      clearcoat: tile.clearcoat,
    };
    material = new MeshPhysicalMaterial(physicalSettings);
  } else {
    material = new MeshStandardMaterial(standardSettings);
  }
  if (tile.colors) {
    material = [
      material,
      ...tile.colors.map((sideColor) => new MeshPhysicalMaterial({ color: sideColor })),
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
  instancedMeshPromise: Promise<{
    mesh: InstancedMesh,
    scale?: number
  }>,
): Promise<void> {
  const scaledInstancedMesh = await instancedMeshPromise;
  const { scale, mesh } = scaledInstancedMesh;
  if (scale) {
    dummy.scale.set(scale, -scale, -1);
  } else {
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

export default createInstancedMesh;
