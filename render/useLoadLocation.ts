/* eslint-disable no-param-reassign */
import {
  Dispatch, SetStateAction, useEffect, useRef,
} from 'react';
import { gql, useQuery } from '@apollo/client';
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
  Camera,
} from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader';
import { PNG } from 'pngjs';
import FastAverageColor from 'fast-average-color';
import {
  Location, Plane, Tile, LocationEntity, BackgroundVersions, LookupTable, GameEntity,
} from '../utils/interfaces';
import colorLookup from '../utils/colorLookup';
import MeshData from '../meshData';

const LOCATION = gql`
  query GetGameState {
    locationId,
  }
`;

function average(array:Array<number>) {
  const sum = array.reduce((total, number) => number + total, 0);
  return sum / array.length;
}

// units are meters let's say
// const depth = 0.1;
// const cubeUnit = 3;

async function loadPlan(url:string) {
  const buffer = await (await fetch(url)).arrayBuffer();
  return new Promise<PNG>((resolve) => {
    new PNG().parse(Buffer.from(buffer), (e, pngData:PNG) => {
      resolve(pngData);
    });
  });
}

function placeInstanceAtDummy(
  id: string,
  dummy: Object3D,
  instance: InstancedMesh,
  count: Record<string, number>,
  scale: number,
) {
  if (scale) {
    dummy.scale.set(scale, -scale, -1);
  } else {
    // reset
    dummy.scale.set(1, 1, 1);
  }
  dummy.updateMatrix();
  instance.setMatrixAt(count[id], dummy.matrix);
  count[id] += 1;
}

function cleanup(mesh: Mesh) {
  mesh.geometry.dispose();
  if (Array.isArray(mesh.material)) {
    mesh.material.forEach((material) => material.dispose());
  } else {
    mesh.material.dispose();
  }
  if (mesh.parent) {
    mesh.parent.remove(mesh);
  }
}

// eslint-disable-next-line import/prefer-default-export
const useLoadLocation = async (
  scene: Scene,
  location: Location,
  setCameraDefaultPosition: Dispatch<SetStateAction<Vector3>>,
  camera: PerspectiveCamera,
  dummyCamera: Camera,
  light: DirectionalLight,
  setGameEntities: Dispatch<SetStateAction<Record<string, GameEntity>>>, // objects you can click on
  ambientLight: AmbientLight,
  hemisphereLight: HemisphereLight,
  cubeUnit: number, // possibly moved to location file
  depth: number, // possibly moved to location file
  lookupTables: Record<string, LookupTable>,
  filteredBackgrounds: Record<string, BackgroundVersions>,
  setFilteredBackgrounds: Dispatch<SetStateAction<Record<string, BackgroundVersions>>>,
): Promise<void> => {
  const { loading, /* error, */ data } = useQuery(LOCATION);
  const { locationId } = data;
  const cleanupList = useRef<Mesh[]>([]);
  const cameraPosition = new Vector3();
  const loader = new TextureLoader();
  const dummy = new Object3D();
  const {
    walls, horizontalPlanes, entities, background, groundLightTexture, skyLightTexture,
  } = location;

  function filterBackground() {
    if (!filteredBackgrounds[background]) { // don't reload if already exists
      const image = new Image();
      image.src = background;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      image.addEventListener('load', () => {
        canvas.width = image.width;
        canvas.height = image.height;
        if (ctx) {
          ctx.drawImage(image, 0, 0);
          const imageData = ctx.getImageData(0, 0, image.width, image.height);
          setFilteredBackgrounds({
            ...filteredBackgrounds,
            [background]: {
              default: new ImageData(imageData.data, imageData.width),
              sunset: new ImageData(
                colorLookup(lookupTables.LateSunset, imageData.data), imageData.width,
              ),
              night: new ImageData(
                colorLookup(lookupTables.nightfromday, imageData.data), imageData.width,
              ),
            },
          });
        }
      });
    }
  }

  async function createInstancedMeshes(
    id: string,
    tile: Tile,
    holder: Record<string, InstancedMesh>,
    count: number, // different because is not being set
    scale: Record<string, number>,
    castShadow: boolean,
    receiveShadow: boolean,
  ) {
    let wallMap;
    let geometry;
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
          scale[id] = cubeUnit / y;
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
    let material:MeshStandardMaterial | MeshStandardMaterial[] = new MeshStandardMaterial({
      map: wallMap,
      transparent: typeof tile === 'string' || !tile.geometry,
    });
    if (tile.colors) {
      material = [material, ...tile.colors.map((color) => new MeshStandardMaterial({ color }))];
    }
    const mesh = new InstancedMesh(
      geometry, material, count,
    );
    mesh.castShadow = castShadow;
    mesh.receiveShadow = receiveShadow;
    cleanupList.current.push(mesh);
    scene.add(mesh);
    holder[id] = mesh;
  }

  async function loadWalls(): Promise<void> {
    const xValues: Array<number> = [];
    const zValues: Array<number> = [];
    const tileCount: Record<string, number> = {};
    const tileType: Record<string, InstancedMesh> = {};
    const tileScale: Record<string, number> = {};

    const { plan, tiles } = walls;

    const png = await loadPlan(plan);

    // set lighting location for shadows
    const centerX = (png.width * cubeUnit) / 2;
    const centerZ = (png.height * cubeUnit) / 2;
    light.shadow.camera.top = (png.height * cubeUnit) / 2;
    light.shadow.camera.right = (png.width * cubeUnit) / 2;
    light.shadow.camera.bottom = -(png.height * cubeUnit) / 2;
    light.shadow.camera.left = -(png.width * cubeUnit) / 2;
    // first subtract target position from camera position to keep relative
    // value in case the code for setting the light's position has already ran
    light.position.sub(light.target.position);
    // move target to center
    light.target.position.set(centerX, 0, centerZ);
    // add it back to light position
    light.position.add(light.target.position);
    light.shadow.camera.updateProjectionMatrix();

    // first pass over png to get number per instanced mesh
    png.data.forEach((value, index) => {
      // index % 4 === 3 indicates opacity which isn't relevant
      if (tiles[value] && index % 4 !== 3) { // exists
        if (tileCount[value]) {
          tileCount[value] += 1;
        } else {
          tileCount[value] = 1;
        }
      }
    });

    await Promise.all(Object.entries(tiles).map(
      ([id, tile]) => createInstancedMeshes(
        id, tile, tileType, tileCount[id], tileScale, true, true,
      ),
    ));

    // reset tileCount to be reused because the name is nice and ids are already there
    Object.keys(tileCount).forEach((id) => { tileCount[id] = 0; });
    // second pass over png to place instanced mesh
    png.data.forEach((id, index) => { // value of the pixel becomes id
      const stringId = id.toString();
      const direction = index % 4;
      const x = Math.floor(index / 4) % png.width;
      const y = Math.floor((index / 4) / png.width);
      switch (direction) {
        case 0:
          if (tileType[stringId]) {
            // left-facing wall
            dummy.position.set(
              x * cubeUnit - ((cubeUnit - depth) / 2),
              cubeUnit / 2,
              y * cubeUnit,
            );
            dummy.rotation.set(0, -Math.PI / 2, 0);
            placeInstanceAtDummy(
              stringId, dummy, tileType[stringId], tileCount, tileScale[stringId],
            );
          }
          break;
        case 1:
          if (tileType[stringId]) {
            // bottom-facing wall
            dummy.position.set(
              x * cubeUnit,
              cubeUnit / 2,
              y * cubeUnit + ((cubeUnit - depth) / 2),
            );
            dummy.rotation.set(0, 0, 0);
            placeInstanceAtDummy(
              stringId, dummy, tileType[stringId], tileCount, tileScale[stringId],
            );
          }
          break;
        case 2:
          if (tileType[stringId]) {
            // right-facing wall
            dummy.position.set(
              x * cubeUnit + ((cubeUnit - depth) / 2),
              cubeUnit / 2,
              y * cubeUnit,
            );
            dummy.rotation.set(0, Math.PI / 2, 0);
            placeInstanceAtDummy(
              stringId, dummy, tileType[stringId], tileCount, tileScale[stringId],
            );
          }
          break;
        case 3:
          // for camera position calculation
          if (stringId === '0') {
            xValues.push(x);
            zValues.push(y);
          }
          break;
        default:
          break;
      }
    });

    Object.values(tileType).forEach((wall) => {
      wall.instanceMatrix.needsUpdate = true;
    });
    cameraPosition.set(
      average(xValues) * cubeUnit,
      1.5,
      average(zValues) * cubeUnit,
    );
    setCameraDefaultPosition(cameraPosition);
    dummyCamera.position.copy(cameraPosition);
    camera.position.copy(cameraPosition);
  }

  async function loadPlane(
    plane: Plane,
    height: number,
    unit: number,
    rotation: Euler,
    castShadow: boolean,
    receiveShadow: boolean,
  ): Promise<void> {
    const tileCount: Record<string, number> = {};
    const tileType: Record<string, InstancedMesh> = {};
    const tileScale: Record<string, number> = {};
    const { plan, tiles } = plane;

    const png = await loadPlan(plan);

    // first pass over png to get number per instanced mesh
    for (let i = 0; i < png.data.length; i += 4) {
      const code = `${
        png.data[i].toString(16)}${
        png.data[i + 1].toString(16)}${
        png.data[i + 2].toString(16)
      }`;
      if (tiles[code]) { // exists
        if (tileCount[code]) {
          tileCount[code] += 1;
        } else {
          tileCount[code] = 1;
        }
      }
    }

    await Promise.all(Object.entries(tiles).map(
      ([id, tile]) => createInstancedMeshes(
        id, tile, tileType, tileCount[id], tileScale, castShadow, receiveShadow,
      ),
    ));

    // reset tileCount to be reused because the name is nice and ids are already there
    Object.keys(tileCount).forEach((id) => { tileCount[id] = 0; });
    // second pass over png to place instanced mesh
    for (let i = 0; i < png.data.length; i += 4) {
      const code = `${
        png.data[i].toString(16)}${
        png.data[i + 1].toString(16)}${
        png.data[i + 2].toString(16)
      }`;
      const x = (i / 4) % png.width;
      const y = Math.floor((i / 4) / png.width);
      if (tileType[code]) {
        dummy.position.set(x * unit, height, y * unit);
        dummy.rotation.copy(rotation);
        dummy.updateMatrix();
        placeInstanceAtDummy(code, dummy, tileType[code], tileCount, tileScale[code]);
      }
    }
    Object.values(tileType).forEach((tile) => {
      tile.instanceMatrix.needsUpdate = true;
    });
  }

  async function loadEntities(entityList: Record<string, LocationEntity>): Promise<void> {
    const gameEntities:Record<string, GameEntity> = {};
    const svgLoader = new SVGLoader();
    await Promise.all(Object.entries(entityList).map(async ([id, entity]) => {
      const entityData = MeshData[entity.meshId];
      const [svgData, texture] = await Promise.all([
        svgLoader.loadAsync(entityData.geometry),
        loader.loadAsync(entityData.file),
      ]);
      const shape = svgData.paths[0].toShapes(true);
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
      entityMesh.scale.set(scale, -scale, -0.01);
      entityMesh.castShadow = true;
      entityMesh.receiveShadow = true;
      entityMesh.name = id;
      entityMesh.position.set(entity.x * cubeUnit, entityData.height / 2, entity.z * cubeUnit);
      if (entity.visible) {
        entityMesh.visible = entity.visible();
      }
      entityMesh.lookAt(
        cameraPosition.x,
        entityData.height / 2,
        cameraPosition.z,
      );
      cleanupList.current.push(entityMesh);

      gameEntities[id] = {
        mesh: entityMesh,
        activate: entity.activate,
        cameraAdjustment: entityData.cameraAdjustment,
        getVisibility: entity.visible,
        getPosition: () => new Vector3(
          entity.x * cubeUnit,
          (entity.y || entityData.height / 2),
          entity.z * cubeUnit,
        ),
      };
      scene.add(entityMesh);
    }));
    setGameEntities(gameEntities);
  }

  async function loadAmbientLights(): Promise<void> {
    const fac = new FastAverageColor();
    const [skyColor, groundColor, backgroundColor] = await Promise.all([
      fac.getColorAsync(skyLightTexture),
      fac.getColorAsync(groundLightTexture),
      fac.getColorAsync(background),
    ]);
    hemisphereLight.color = new Color(skyColor.rgb);
    hemisphereLight.groundColor = new Color(groundColor.rgb);
    ambientLight.color = new Color(backgroundColor.rgb);
    scene.add(hemisphereLight);
    scene.add(ambientLight);
  }

  async function loadLocation() {
    const doneLoadingWalls = loadWalls();
    horizontalPlanes.forEach((plane, index) => {
      if (index === 0) { // ground plane
        loadPlane(plane, -depth / 2, cubeUnit, new Euler(-Math.PI / 2, 0, 0), false, true);
      } else { // ceiling planes
        loadPlane(
          plane, cubeUnit * index + depth / 2, cubeUnit, new Euler(Math.PI / 2, 0, 0), true, false,
        );
      }
    });
    loadAmbientLights();
    filterBackground();

    await doneLoadingWalls; // do this so that entities can face the camera
    if (entities) {
      loadEntities(entities);
    }
  }

  useEffect(() => {
    if (!loading && locationId && Object.keys(lookupTables).length) {
      loadLocation();
      return () => {
        while (cleanupList.current.length) {
          const next = cleanupList.current.shift();
          if (next) {
            cleanup(next);
          }
        }
        setGameEntities({});
      };
    }
    return () => { /* do nothing */ };
  }, [loading, locationId, lookupTables]);
};

export default useLoadLocation;
