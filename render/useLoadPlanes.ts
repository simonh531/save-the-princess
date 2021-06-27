/* eslint-disable no-param-reassign */
import { useCallback, useEffect, useState } from 'react';
import { gql, useQuery } from '@apollo/client';
import {
  // MeshStandardMaterial,
  Scene,
  Object3D,
  Euler,
} from 'three';
import { cleanTileArray } from './meshCleanup';
import { Plane, ScaledInstancedMesh } from '../utils/interfaces';
import Locations from '../locations';
import createInstancedMeshes, { loadPlan, placeInstanceAtDummy } from './createInstancedMeshes';

const LOCATION = gql`
  query GetGameState {
    locationId,
  }
`;

async function loadPlane(
  scene: Scene,
  plane: Plane,
  height: number,
  rotation: Euler,
  castShadow: boolean,
  receiveShadow: boolean,
  mapWidth: number,
  mapDepth: number,
  unit: number,
  depth: number,
): Promise<Record<string, Promise<ScaledInstancedMesh>>> {
  const tileCount: Record<string, number> = {};
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

  const tileMeshes:Record<string, Promise<ScaledInstancedMesh>> = {};
  Object.entries(tiles).forEach(
    ([id, tile]) => {
      tileMeshes[id] = createInstancedMeshes(
        tile, tileCount[id], castShadow, receiveShadow, depth, unit,
      );
    },
  );

  // reset tileCount to be reused because the name is nice and ids are already there
  Object.keys(tileCount).forEach((id) => { tileCount[id] = 0; });
  // second pass over png to place instanced mesh
  const pngPromises:Promise<void>[] = [];
  for (let i = 0; i < png.data.length; i += 4) {
    const code = `${
      png.data[i].toString(16)}${
      png.data[i + 1].toString(16)}${
      png.data[i + 2].toString(16)
    }`;
    const x = (i / 4) % mapWidth;
    const y = Math.floor((i / 4) / mapWidth);
    if (tileMeshes[code]) {
      const currentIndex = tileCount[code];
      tileCount[code] += 1;
      const dummy = new Object3D();
      dummy.position.set(
        (x - (mapWidth / 2) + 0.5) * unit,
        height - unit / 2,
        (y - (mapDepth / 2) + 0.5) * unit,
      );
      dummy.rotation.copy(rotation);
      dummy.updateMatrix();
      pngPromises.push(placeInstanceAtDummy(
        currentIndex,
        dummy,
        tileMeshes[code],
      ));
    }
  }
  Object.values(tileMeshes).forEach(async (tilePromise) => {
    const tile = await tilePromise;
    tile.mesh.instanceMatrix.needsUpdate = true;
    scene.add(tile.mesh);
  });
  return tileMeshes;
}

const useLoadPlanes = (
  scene: Scene,
  cubeUnit: number, // possibly moved to location file
  depth: number, // possibly moved to location file
):boolean => {
  const { data } = useQuery(LOCATION);
  const { locationId } = data;
  const [loaded, setLoaded] = useState(false);

  const loadPlanes = useCallback(async () => {
    const location = Locations[locationId];
    const { mapWidth, mapDepth, horizontalPlanes } = location;
    const planes = horizontalPlanes.map((plane, index) => {
      if (index === 0) { // ground plane
        return loadPlane(
          scene, plane, -depth / 2, new Euler(-Math.PI / 2, 0, 0),
          false, true, mapWidth, mapDepth, cubeUnit, depth,
        );
      } // ceiling planes
      return loadPlane(
        scene, plane, cubeUnit * index + depth / 2, new Euler(Math.PI / 2, 0, 0),
        true, false, mapWidth, mapDepth, cubeUnit, depth,
      );
    });
    setLoaded(true);
    return planes;
  }, [cubeUnit, depth, locationId, scene]);

  useEffect(() => {
    setLoaded(false);
    if (Locations[locationId]) {
      const planes = loadPlanes();
      return () => {
        cleanTileArray(planes);
      };
    }
    return () => { /* do nothing */ };
  }, [locationId, loadPlanes]);

  return loaded;
};

export default useLoadPlanes;
