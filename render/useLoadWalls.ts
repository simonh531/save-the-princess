/* eslint-disable no-param-reassign */
import { useCallback, useEffect, useState } from 'react';
import { gql, useQuery } from '@apollo/client';
import {
  Scene,
  Vector3,
  Object3D,
} from 'three';
import { cleanTiles } from './meshCleanup';
import { ScaledInstancedMesh } from '../utils/interfaces';
import Locations from '../locations';
import createInstancedMeshes, { loadPlan, placeInstanceAtDummy } from './createInstancedMeshes';

const LOCATION = gql`
  query GetGameState {
    locationId,
  }
`;

// units are meters let's say
// const depth = 0.1;
// const cubeUnit = 3;

const useLoadWalls = (
  scene: Scene,
  cubeUnit: number, // possibly moved to location file
  depth: number, // possibly moved to location file
):boolean => {
  const { data } = useQuery(LOCATION);
  const { locationId } = data;
  const [loaded, setLoaded] = useState(false);

  const loadWalls = useCallback(async () => {
    const location = Locations[locationId];
    const cameraPosition = new Vector3();
    const {
      mapWidth, mapDepth, cameraX, cameraZ, walls,
    } = location;

    const tileMeshes:Record<string, Promise<ScaledInstancedMesh>> = {};

    if (walls) {
      const tileCount: Record<string, number> = {};
      const { plan, tiles } = walls;
      const png = await loadPlan(plan);
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

      Object.entries(tiles).forEach(
        ([id, tile]) => {
          tileMeshes[id] = createInstancedMeshes(
            tile, tileCount[id], true, true, depth, cubeUnit,
          );
        },
      );

      // reset tileCount to be reused because the name is nice and ids are already there
      Object.keys(tileCount).forEach((id) => { tileCount[id] = 0; });
      // second pass over png to place instanced mesh
      const pngPromises:Promise<void>[] = [];
      png.data.forEach((id, index) => { // value of the pixel becomes id
        const stringId = id.toString();
        const direction = index % 4;
        const x = Math.floor(index / 4) % mapWidth;
        const y = Math.floor((index / 4) / mapWidth);
        switch (direction) {
          case 0:
            if (tileMeshes[stringId]) {
              // left-facing wall
              const currentIndex = tileCount[stringId];
              tileCount[stringId] += 1;
              const dummy = new Object3D();
              dummy.position.set(
                (x - (mapWidth / 2) + 0.5) * cubeUnit - ((cubeUnit - depth) / 2),
                0, // cubeUnit / 2,
                (y - (mapDepth / 2) + 0.5) * cubeUnit,
              );
              dummy.rotation.set(0, -Math.PI / 2, 0);
              pngPromises.push(placeInstanceAtDummy(
                currentIndex,
                dummy,
                tileMeshes[stringId],
              ));
            }
            break;
          case 1:
            if (tileMeshes[stringId]) {
              // bottom-facing wall
              const currentIndex = tileCount[stringId];
              tileCount[stringId] += 1;
              const dummy = new Object3D();
              dummy.position.set(
                (x - (mapWidth / 2) + 0.5) * cubeUnit,
                0, // cubeUnit / 2,
                (y - (mapDepth / 2) + 0.5) * cubeUnit + ((cubeUnit - depth) / 2),
              );
              dummy.rotation.set(0, 0, 0);
              pngPromises.push(placeInstanceAtDummy(
                currentIndex,
                dummy,
                tileMeshes[stringId],
              ));
            }
            break;
          case 2:
            if (tileMeshes[stringId]) {
              // right-facing wall
              const currentIndex = tileCount[stringId];
              tileCount[stringId] += 1;
              const dummy = new Object3D();
              dummy.position.set(
                (x - (mapWidth / 2) + 0.5) * cubeUnit + ((cubeUnit - depth) / 2),
                0, // cubeUnit / 2,
                (y - (mapDepth / 2) + 0.5) * cubeUnit,
              );
              dummy.rotation.set(0, Math.PI / 2, 0);
              pngPromises.push(placeInstanceAtDummy(
                currentIndex,
                dummy,
                tileMeshes[stringId],
              ));
            }
            break;
          default:
            break;
        }
      });

      await Promise.all(pngPromises);

      Object.values(tileMeshes).forEach(async (wallPromise) => {
        const wall = await wallPromise;
        wall.mesh.instanceMatrix.needsUpdate = true;
        scene.add(wall.mesh);
      });
    }

    cameraPosition.set(
      (cameraX - (mapWidth / 2) + 0.5) * cubeUnit,
      0, // 1.5,
      (cameraZ - (mapWidth / 2) + 0.5) * cubeUnit,
    );

    setLoaded(true);
    return tileMeshes;
  }, [cubeUnit, depth, locationId, scene]);

  useEffect(() => {
    setLoaded(false);
    if (Locations[locationId]) {
      const tiles = loadWalls();
      return () => {
        cleanTiles(tiles);
      };
    }
    return () => { /* do nothing */ };
  }, [loadWalls, locationId]);

  return loaded;
};

export default useLoadWalls;
