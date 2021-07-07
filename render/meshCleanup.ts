import { Mesh, MeshStandardMaterial } from 'three';
import { GameEntity, InstancedMeshData } from '../utils/interfaces';

export function cleanup(mesh: Mesh):void {
  if (mesh.parent) {
    mesh.parent.remove(mesh);
  }
  mesh.geometry.dispose();
  if (Array.isArray(mesh.material)) {
    mesh.material.forEach((material) => {
      if (material instanceof MeshStandardMaterial && material.map) {
        material.map.dispose();
      }
      material.dispose();
    });
  } else {
    if (mesh.material instanceof MeshStandardMaterial && mesh.material.map) {
      mesh.material.map.dispose();
    }
    mesh.material.dispose();
  }
}

export async function cleanTilesArray(
  tiles:Promise<Map<string, InstancedMeshData>[]>,
):Promise<void> {
  (await tiles).forEach(async (tile) => tile.forEach(
    async (meshData) => cleanup((await meshData.meshData).mesh),
  ));
}

export async function cleanEntities(
  entities:Promise<Map<string, GameEntity>>,
):Promise<void> {
  (await entities).forEach((entity) => {
    entity.group.children.forEach((object3D) => {
      if (object3D instanceof Mesh) {
        cleanup(object3D);
      }
    });
    if (entity.group.parent) {
      entity.group.parent.remove(entity.group);
    }
  });
}
