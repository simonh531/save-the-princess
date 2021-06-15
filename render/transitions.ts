/* eslint-disable no-param-reassign */
import { Material } from 'three';

// eslint-disable-next-line import/prefer-default-export
export const transitionOpacity = (material: Material, target: number, delta: number):boolean => {
  if (material.opacity > target) {
    material.opacity -= delta * 0.005;
    if (material.opacity < target) {
      material.opacity = target;
      return false; // finished
    }
  } else if (material.opacity < target) {
    material.opacity += delta * 0.005;
    if (material.opacity > target) {
      material.opacity = target;
      return false; // finished
    }
  }
  return true;
};
