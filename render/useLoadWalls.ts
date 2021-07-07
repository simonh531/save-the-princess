/* eslint-disable no-param-reassign */
import { useCallback, useEffect, useState } from 'react';
import { gql, useQuery } from '@apollo/client';
import {
  Scene,
  Object3D,
} from 'three';
import { cleanTilesArray } from './meshCleanup';
import Locations from '../locations';
import createInstancedMeshes, { loadPlan, placeInstanceAtDummy } from './createInstancedMesh';
import { InstancedMeshData } from '../utils/interfaces';

const LOCATION = gql`
  query GetGameState {
    locationId,
  }
`;

const useLoadWalls = (
  scene: Scene,
):boolean => {
  const { data } = useQuery(LOCATION);
  const { locationId } = data;
  const [loaded, setLoaded] = useState(false);

  const loadWalls = useCallback(async () => {
    const location = Locations[locationId];
    const {
      mapWidth, mapHeight, mapDepth, walls = [],
    } = location;

    const wallMeshArray = walls.map(async (wallData, wallIndex) => {
      const wallMeshes:Map<string, InstancedMeshData> = new Map();
      const wallCount: Map<string, number> = new Map();
      const {
        plan, tiles, unit = 1, aspect = 1,
      } = wallData;
      if (plan && tiles) {
        const png = await loadPlan(plan);
        // first pass over png to get number per instanced mesh
        png.data.forEach((value) => {
          if (tiles.has(`${value}`)) { // exists
            const count = wallCount.get(`${value}`);
            if (count !== undefined) {
              wallCount.set(`${value}`, count + 1);
            } else {
              wallCount.set(`${value}`, 1);
            }
          }
        });

        tiles.forEach((tile, id) => {
          const count = wallCount.get(id);
          if (count !== undefined) {
            wallMeshes.set(id, {
              depth: tile.depth || 0.1,
              meshData: createInstancedMeshes(
                tile, count, {
                  castShadow: true,
                  receiveShadow: true,
                  unit,
                  aspect,
                },
              ),
            });
          }
        });

        // reset wallCount to be reused because the name is nice and ids are already there
        wallCount.forEach((_, id) => wallCount.set(id, 0));
        // second pass over png to place instanced mesh
        const pngPromises:Promise<void>[] = [];
        png.data.forEach((id, index) => { // value of the pixel becomes id
          const wallMeshdata = wallMeshes.get(`${id}`);
          const currentIndex = wallCount.get(`${id}`);
          if (wallMeshdata && currentIndex !== undefined) {
            const direction = index % 4;
            const x = Math.floor(index / 4) % png.width;
            const z = Math.floor((index / 4) / png.width);
            const { meshData, depth } = wallMeshdata;
            const dummy = new Object3D();
            wallCount.set(`${id}`, currentIndex + 1);
            let accumulatedHeight = 0;
            for (let i = 0; i < wallIndex; i += 1) {
              accumulatedHeight += (walls[i].unit || 1) / (walls[i].aspect || 1);
            }
            const y = accumulatedHeight + (unit / aspect - mapHeight) / 2;
            switch (direction) {
              case 0:
                // left-facing wall
                dummy.position.set(
                  (x + 0.5) * unit - (mapWidth + unit - depth) / 2,
                  y,
                  (z + 0.5) * unit - mapDepth / 2,
                );
                dummy.rotation.set(0, -Math.PI / 2, 0);
                break;
              case 1:
                // bottom-facing wall
                dummy.position.set(
                  (x + 0.5) * unit - mapWidth / 2,
                  y,
                  (z + 0.5) * unit - (mapDepth - unit + depth) / 2,
                );
                dummy.rotation.set(0, 0, 0);
                break;
              case 2:
                // right-facing wall
                dummy.position.set(
                  (x + 0.5) * unit - (mapWidth - unit + depth) / 2,
                  y,
                  (z + 0.5) * unit - mapDepth / 2,
                );
                dummy.rotation.set(0, Math.PI / 2, 0);
                break;
              case 3:
                // top-facing wall
                dummy.position.set(
                  (x + 0.5) * unit - mapWidth / 2,
                  y,
                  (z + 0.5) * unit - (mapDepth + unit - depth) / 2,
                );
                dummy.rotation.set(0, Math.PI, 0);
                break;
              default:
                break;
            }
            pngPromises.push(placeInstanceAtDummy(
              currentIndex,
              dummy,
              meshData,
            ));
          }
        });

        await Promise.all(pngPromises); // wait for tiles to have been placed at dummies

        wallMeshes.forEach(async (wallPromise) => {
          const wall = await wallPromise.meshData;
          wall.mesh.instanceMatrix.needsUpdate = true;
          scene.add(wall.mesh);
        });
      }
      return wallMeshes;
    });
    const holder = await Promise.all(wallMeshArray);
    setLoaded(true);
    return holder;
  }, [locationId, scene]);

  useEffect(() => {
    setLoaded(false);
    if (Locations[locationId]) {
      const walls = loadWalls();
      return async () => {
        cleanTilesArray(walls);
      };
    }
    return () => { /* do nothing */ };
  }, [loadWalls, locationId]);

  return loaded;
};

export default useLoadWalls;
