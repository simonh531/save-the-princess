import { Vector3 } from 'three';
import { Location } from '../utils/interfaces';

function calcCameraPosition(location:Location, eyeHeight: number):Vector3 {
  const {
    mapWidth, mapHeight, mapDepth, cameraX, cameraY, cameraZ,
  } = location;
  return new Vector3(
    cameraX - mapWidth / 2,
    cameraY - mapHeight / 2 + eyeHeight,
    cameraZ - mapDepth / 2,
  );
}

export default calcCameraPosition;
