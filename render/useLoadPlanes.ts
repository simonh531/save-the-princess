/* eslint-disable no-param-reassign */
import { useCallback, useEffect, useState } from 'react';
import { gql, useQuery } from '@apollo/client';
import {
  Scene,
  Object3D,
  Euler,
} from 'three';
import { cleanTilesArray } from './meshCleanup';
import { InstancedMeshData } from '../utils/interfaces';
import Locations from '../locations';
import createInstancedMesh, { loadPlan, placeInstanceAtDummy } from './createInstancedMesh';

const LOCATION = gql`
  query GetGameState {
    locationId,
  }
`;

const useLoadPlanes = (
  scene: Scene,
):boolean => {
  const { data } = useQuery(LOCATION);
  const { locationId } = data;
  const [loaded, setLoaded] = useState(false);

  const loadPlanes = useCallback(async () => {
    const location = Locations[locationId];
    const {
      mapWidth, mapHeight, mapDepth, horizontalPlanes = [],
    } = location;

    const planes = horizontalPlanes.map(async (plane, index) => {
      let receiveShadow = false;
      let castShadow = false;
      if (index === 0) { // ground plane
        receiveShadow = true;
      } else {
        castShadow = true;
        if (index !== horizontalPlanes.length - 1) {
          receiveShadow = true;
        }
      }

      const planeMeshes:Map<string, InstancedMeshData> = new Map();
      const planeCount: Map<string, number> = new Map();
      const {
        plan, tiles, unit = 1, clipBelow,
      } = plane;
      if (plan && tiles) {
        const png = await loadPlan(plan);
        // first pass over png to get number per instanced mesh
        for (let i = 0; i < png.data.length; i += 4) {
          const code = `${
            png.data[i].toString(16)}${
            png.data[i + 1].toString(16)}${
            png.data[i + 2].toString(16)
          }`;
          if (tiles.has(code)) { // exists
            const count = planeCount.get(code);
            if (count !== undefined) {
              planeCount.set(code, count + 1);
            } else {
              planeCount.set(code, 1);
            }
          }
        }

        tiles.forEach(
          (tile, id) => {
            const count = planeCount.get(id);
            if (count !== undefined) {
              planeMeshes.set(id, {
                meshData: createInstancedMesh(
                  tile, count, { castShadow, receiveShadow, unit },
                ),
                depth: tile.depth || 0.1,
              });
            }
          },
        );

        // reset planeCount to be reused because the name is nice and ids are already there
        planeCount.forEach((_, id) => planeCount.set(id, 0));
        // second pass over png to place instanced mesh
        const pngPromises:Promise<void>[] = [];
        for (let i = 0; i < png.data.length; i += 4) {
          const code = `${
            png.data[i].toString(16)}${
            png.data[i + 1].toString(16)}${
            png.data[i + 2].toString(16)
          }`;
          const planeMeshData = planeMeshes.get(code);
          const currentIndex = planeCount.get(code);
          if (planeMeshData && currentIndex !== undefined) {
            const { meshData, depth } = planeMeshData;
            planeCount.set(code, currentIndex + 1);
            const dummy = new Object3D();
            let accumulatedHeight = 0;
            for (let j = 0; j < index; j += 1) {
              accumulatedHeight += horizontalPlanes[j].unit || 1;
            }
            const x = (((i / 4) % png.width) + 0.5) * unit - mapWidth / 2;
            const y = accumulatedHeight - mapHeight / 2;
            const z = (Math.floor((i / 4) / png.width) + 0.5) * unit - mapDepth / 2;
            if (clipBelow) {
              dummy.position.set(x, y - depth / 2, z);
              dummy.rotation.copy(new Euler(-Math.PI / 2, 0, 0));
            } else {
              dummy.position.set(x, y + depth / 2, z);
              dummy.rotation.copy(new Euler(Math.PI / 2, 0, 0));
            }
            dummy.updateMatrix();
            pngPromises.push(placeInstanceAtDummy(currentIndex, dummy, meshData));
          }
        }

        await Promise.all(pngPromises); // wait for tiles to have been placed at dummies

        planeMeshes.forEach(async (planePromise) => {
          const tile = await planePromise.meshData;
          tile.mesh.instanceMatrix.needsUpdate = true;
          scene.add(tile.mesh);
        });
      }
      return planeMeshes;
    });
    const holder = await Promise.all(planes);
    setLoaded(true);
    return holder;
  }, [locationId, scene]);

  useEffect(() => {
    setLoaded(false);
    if (Locations[locationId]) {
      const planes = loadPlanes();
      return () => {
        cleanTilesArray(planes);
      };
    }
    return () => { /* do nothing */ };
  }, [locationId, loadPlanes]);

  return loaded;
};

export default useLoadPlanes;
