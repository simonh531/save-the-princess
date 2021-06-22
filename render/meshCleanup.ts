import { Mesh } from 'three';
import { GameEntity, ScaledInstancedMesh } from '../utils/interfaces';

export function cleanup(mesh: Mesh):void {
  if (mesh.parent) {
    mesh.parent.remove(mesh);
  }
  mesh.geometry.dispose();
  if (Array.isArray(mesh.material)) {
    mesh.material.forEach((material) => material.dispose());
  } else {
    mesh.material.dispose();
  }
}

export async function cleanTiles(
  tiles:Promise<Record<string, Promise<ScaledInstancedMesh>>>,
):Promise<void> {
  Object.values(await tiles).forEach(async (tile) => cleanup((await tile).mesh));
}

export async function cleanTileArray(
  tileArrayPromise: Promise<Promise<Record<string, Promise<ScaledInstancedMesh>>>[]>,
):Promise<void> {
  (await tileArrayPromise).forEach((tileset) => cleanTiles(tileset));
}

export async function cleanEntities(
  entities:Promise<GameEntity[]>,
):Promise<void> {
  (await entities).forEach((entity) => cleanup(entity.mesh));
}
