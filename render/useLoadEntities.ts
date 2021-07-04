import {
  useCallback, useEffect, useRef, useState,
} from 'react';
import { gql, useQuery } from '@apollo/client';
import {
  Mesh,
  ExtrudeGeometry,
  RepeatWrapping,
  TextureLoader,
  Scene,
  Vector3,
  MeshStandardMaterial,
  sRGBEncoding,
  Group,
  AnimationMixer,
  LoopOnce,
  BooleanKeyframeTrack,
  AnimationClip,
  NumberKeyframeTrack,
  Layers,
} from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader';
import { cleanEntities } from './meshCleanup';
import Locations from '../locations';
import { ChangeMeshCommand, GameEntity } from '../utils/interfaces';
import MeshData from '../meshData';
import { getActiveMesh, getActiveMixer } from '../utils/getters';
import { resetCommandQueue } from '../data/state';

const LOCATION_CHECKS = gql`
  query GetLocationChecks {
    locationId,
    checks,
    commandQueue,
  }
`;

const transparentKF = new BooleanKeyframeTrack('.material.transparent', [0, 1], [true, false]);
const fadeIn = new AnimationClip('fadeIn', -1, [
  new NumberKeyframeTrack('.material.opacity', [0, 1], [0, 1]),
  new BooleanKeyframeTrack('.visible', [0, 1], [true, true]),
  transparentKF,
]);
const fadeOut = new AnimationClip('fadeOut', -1, [
  new NumberKeyframeTrack('.material.opacity', [0, 1], [1, 0]),
  new BooleanKeyframeTrack('.visible', [0, 1], [true, false]),
  transparentKF,
]);

const meshFromData = async (
  meshData: { file: string, geometry: string, height?: number },
  svgLoader: SVGLoader,
  loader: TextureLoader,
  depth: number,
  name: string,
  inheritedHeight: number,
  spacing: number,
) => {
  let height = inheritedHeight;
  if (meshData.height) {
    height = meshData.height;
  }
  const [svgData, texture] = await Promise.all([
    svgLoader.loadAsync(meshData.geometry),
    loader.loadAsync(meshData.file),
  ]);
  const shape = svgData.paths[0].toShapes(true);
  const geometry = new ExtrudeGeometry(shape, {
    depth,
    bevelThickness: 0,
    bevelSize: -0.001,
  });
  geometry.center();
  let scale = 0;
  let x = 1;
  let y = 1;
  if (geometry.boundingBox) {
    y = geometry.boundingBox.max.y * 2;
    scale = height / y;
    x = geometry.boundingBox.max.x * 2;
  }
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(1 / x, 1 / y);
  texture.flipY = false;
  texture.encoding = sRGBEncoding;
  const material = new MeshStandardMaterial({
    map: texture,
  });
  const entityMesh = new Mesh(geometry, material);
  entityMesh.name = name;
  entityMesh.visible = false;
  entityMesh.castShadow = true;
  entityMesh.receiveShadow = true;
  entityMesh.scale.set(scale, -scale, -0.01);
  entityMesh.position.set(0, height / 2, spacing * 0.0001);
  return entityMesh;
};

const getMeshes = async (
  id: string,
  svgLoader: SVGLoader,
  loader: TextureLoader,
  depth: number,
) => {
  const meshData = MeshData[id];
  const inheritedHeight = meshData.height;
  return Promise.all([
    meshFromData(meshData, svgLoader, loader, depth, 'default', inheritedHeight, 0),
    ...Object.entries(meshData.alt || {}).map(([altId, data], index) => meshFromData(
      data, svgLoader, loader, depth, altId, inheritedHeight, index + 1,
    )),
  ]);
};

const useLoadEntities = (
  scene: Scene,
  cameraDefaultPosition: Vector3 | undefined,
  cubeUnit: number, // possibly moved to location file
  depth: number, // possibly moved to location file
):[Map<string, GameEntity>, boolean, AnimationMixer[]] => {
  const { data } = useQuery(LOCATION_CHECKS);
  const { locationId, checks, commandQueue } = data;
  const [gameEntities, setGameEntities] = useState<Map<string, GameEntity>>(new Map());
  const [loaded, setLoaded] = useState(false);
  const mixerQueue = useRef<AnimationMixer[]>([]);

  const loadEntities = useCallback(async () => {
    const location = Locations[locationId];
    const { entities, mapWidth, mapDepth } = location;
    const holder:Map<string, GameEntity> = new Map();

    if (entities && entities.size && cameraDefaultPosition) {
      const svgLoader = new SVGLoader();
      const loader = new TextureLoader();
      await Promise.all(Array.from(entities).map(async ([id, entity]) => {
        const entityGroup = new Group();
        entityGroup.name = id;
        const meshes = await getMeshes(entity.meshId, svgLoader, loader, depth);
        const mixers:Record<string, AnimationMixer> = {};
        meshes.forEach((mesh) => {
          entityGroup.add(mesh);
          const newMixer = new AnimationMixer(mesh);
          newMixer.addEventListener('finished', () => {
            const mixerIndex = mixerQueue.current.indexOf(newMixer);
            if (mixerIndex !== -1) {
              mixerQueue.current.splice(mixerIndex, 1);
            }
          });
          mixers[mesh.name] = newMixer;
        });
        entityGroup.position.set(
          (entity.x - (mapWidth / 2) + 0.5) * cubeUnit,
          -cubeUnit / 2,
          (entity.z - (mapDepth / 2) + 0.5) * cubeUnit,
        );
        entityGroup.lookAt(
          cameraDefaultPosition.x,
          -cubeUnit / 2,
          cameraDefaultPosition.z,
        );
        const gameEntity = {
          group: entityGroup,
          altId: entity.altId || 'default',
          mixers,
          activate: entity.activate,
          getVisibility: entity.visible,
          getPosition: () => new Vector3(
            (entity.x - (mapWidth / 2) + 0.5) * cubeUnit,
            -cubeUnit / 2,
            (entity.z - (mapDepth / 2) + 0.5) * cubeUnit,
          ),
        };
        const activeMesh = getActiveMesh(gameEntity);
        if (entity.activate) {
          activeMesh.layers.enable(1);
        }
        if (!(entity.visible && !entity.visible(checks))) {
          activeMesh.visible = true;
        }
        scene.add(entityGroup);
        holder.set(id, gameEntity);
      }));
    }
    setGameEntities(holder);
    setLoaded(true);
    return holder;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraDefaultPosition, cubeUnit, depth, locationId, mixerQueue, scene]);

  useEffect(() => {
    setGameEntities(new Map());
    if (Locations[locationId] && cameraDefaultPosition) {
      const entities = loadEntities();
      return () => {
        cleanEntities(entities);
      };
    }
    return () => { /* do nothing */ };
  }, [locationId, cameraDefaultPosition, loadEntities]);

  // update entities based on checks
  useEffect(() => {
    if (gameEntities.size) {
      gameEntities.forEach((gameEntity) => {
        if (gameEntity.getVisibility) {
          const activeMesh = getActiveMesh(gameEntity);
          if (gameEntity.getVisibility(checks) && !activeMesh.visible) {
            activeMesh.layers.enable(1);
            const mixer = getActiveMixer(gameEntity);
            const fadeInAction = mixer.clipAction(fadeIn);
            fadeInAction.loop = LoopOnce;
            fadeInAction.clampWhenFinished = true;
            fadeInAction.timeScale = 1 / 0.4;
            mixer.stopAllAction();
            fadeInAction.play();
            mixerQueue.current.push(mixer);
          } else if (!gameEntity.getVisibility(checks) && activeMesh.visible) {
            activeMesh.layers.disable(1);
            const mixer = getActiveMixer(gameEntity);
            const fadeOutAction = mixer.clipAction(fadeOut);
            fadeOutAction.loop = LoopOnce;
            fadeOutAction.clampWhenFinished = true;
            fadeOutAction.timeScale = 1 / 0.4;
            mixer.stopAllAction();
            fadeOutAction.play();
            mixerQueue.current.push(mixer);
          }
        }
      });
    }
  }, [gameEntities, checks]);

  // update entities based on commandQueue
  useEffect(() => {
    if (commandQueue.length && gameEntities.size) {
      commandQueue.forEach((commandObject:ChangeMeshCommand) => {
        const { command, id } = commandObject;
        const gameEntity = gameEntities.get(id);
        if (gameEntity) {
          if (command === 'changeMesh' && gameEntity.altId !== commandObject.mesh) {
            const oldActiveMesh = getActiveMesh(gameEntity);
            const oldMixer = getActiveMixer(gameEntity);
            gameEntity.altId = commandObject.mesh;
            const activeMesh = getActiveMesh(gameEntity);
            const mixer = getActiveMixer(gameEntity);

            if (oldActiveMesh.visible) { // only make new mesh visible if original was too
              const fadeOutAction = oldMixer.clipAction(fadeOut);
              const fadeInAction = mixer.clipAction(fadeIn);
              fadeOutAction.loop = LoopOnce;
              fadeInAction.loop = LoopOnce;
              fadeOutAction.clampWhenFinished = true;
              fadeInAction.clampWhenFinished = true;
              fadeOutAction.timeScale = 1 / 0.4;
              fadeInAction.syncWith(fadeOutAction);
              oldMixer.stopAllAction();
              mixer.stopAllAction();
              fadeOutAction.play();
              fadeInAction.play();
              mixerQueue.current.push(oldMixer);
              mixerQueue.current.push(mixer);
            }

            const testLayers = new Layers();
            testLayers.set(1);
            if (oldActiveMesh.layers.test(testLayers)) { // same as above
              oldActiveMesh.layers.disable(1);
              activeMesh.layers.enable(1);
            }
          }
        }
      });
      resetCommandQueue();
    }
  }, [gameEntities, commandQueue]);

  return [gameEntities, loaded, mixerQueue.current];
};

export default useLoadEntities;
