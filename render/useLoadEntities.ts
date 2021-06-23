import { useCallback, useEffect, useState } from 'react';
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
} from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader';
import { cleanEntities } from './meshCleanup';
import Locations from '../locations';
import { GameEntity } from '../utils/interfaces';
import MeshData from '../meshData';

const LOCATION = gql`
  query GetLocation {
    locationId,
  }
`;

const useLoadEntities = (
  scene: Scene,
  cameraPosition: Vector3,
  wallsLoaded: boolean, // indicates that curent camera position is correct
  cubeUnit: number, // possibly moved to location file
  depth: number, // possibly moved to location file
):GameEntity[] => {
  const { data } = useQuery(LOCATION);
  const { locationId } = data;
  const [gameEntities, setGameEntities] = useState<GameEntity[]>([]);

  const loadEntities = useCallback(async () => {
    const location = Locations[locationId];
    const { entities, mapWidth, mapDepth } = location;
    let holder:GameEntity[] = [];

    if (entities && entities.length) {
      const svgLoader = new SVGLoader();
      const loader = new TextureLoader();
      holder = await Promise.all(entities.map(async (entity, index) => {
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
        texture.encoding = sRGBEncoding;
        const material = new MeshStandardMaterial({
          map: texture,
          transparent: true,
        });
        material.envMapIntensity = 0.15;
        const entityMesh = new Mesh(geometry, material);
        entityMesh.scale.set(scale, -scale, -0.01);
        entityMesh.castShadow = true;
        entityMesh.receiveShadow = true;
        entityMesh.userData.index = index;
        entityMesh.position.set(
          (entity.x - (mapWidth / 2) + 0.5) * cubeUnit,
          (entityData.height - cubeUnit) / 2,
          (entity.z - (mapDepth / 2) + 0.5) * cubeUnit,
        );
        if (entity.visible) {
          entityMesh.visible = entity.visible();
        }
        entityMesh.lookAt(
          cameraPosition.x,
          (entityData.height - cubeUnit) / 2,
          cameraPosition.z,
        );
        scene.add(entityMesh);
        return {
          mesh: entityMesh,
          activate: entity.activate,
          getVisibility: entity.visible,
          getPosition: () => new Vector3(
            (entity.x - (mapWidth / 2) + 0.5) * cubeUnit,
            (entityData.height - cubeUnit) / 2,
            (entity.z - (mapDepth / 2) + 0.5) * cubeUnit,
          ),
        };
      }));
    }
    setGameEntities(holder);
    return holder;
  }, [cameraPosition, cubeUnit, depth, locationId, scene]);

  useEffect(() => {
    setGameEntities([]);
    if (Locations[locationId] && wallsLoaded) {
      const entities = loadEntities();
      return () => {
        cleanEntities(entities);
      };
    }
    return () => { /* do nothing */ };
  }, [locationId, wallsLoaded, loadEntities]);

  return gameEntities;
};

export default useLoadEntities;
