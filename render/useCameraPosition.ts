/* eslint-disable no-param-reassign */
import { useEffect, useState } from 'react';
import { gql, useQuery } from '@apollo/client';
import {
  // MeshStandardMaterial,
  Vector3,
  PerspectiveCamera,
  Camera,
} from 'three';
import Locations from '../locations';

const LOCATION = gql`
  query GetGameState {
    locationId,
  }
`;

// units are meters let's say
// const depth = 0.1;
// const cubeUnit = 3;

const useCameraPosition = (
  camera: PerspectiveCamera,
  dummyCamera: Camera,
  cubeUnit: number, // possibly moved to location file
):Vector3 | undefined => {
  const { data } = useQuery(LOCATION);
  const { locationId } = data;
  const [cameraDefaultPosition, setCameraDefaultPosition] = useState<Vector3 | undefined>();

  useEffect(() => {
    const location = Locations[locationId];
    const {
      mapWidth, cameraX, cameraZ, cameraAngle, cameraHorizontalRange, cameraVerticalRange,
    } = location;
    const cameraPosition = new Vector3(
      (cameraX - (mapWidth / 2) + 0.5) * cubeUnit,
      0, // 1.5,
      (cameraZ - (mapWidth / 2) + 0.5) * cubeUnit,
    );

    dummyCamera.userData = { cameraAngle, cameraHorizontalRange, cameraVerticalRange };

    setCameraDefaultPosition(cameraPosition);
    dummyCamera.position.copy(cameraPosition);
    camera.position.copy(cameraPosition);
    if (cameraAngle) {
      dummyCamera.rotation.setFromVector3(cameraAngle, 'YXZ');
      camera.rotation.setFromVector3(cameraAngle, 'YXZ');
    }
  }, [camera, cubeUnit, dummyCamera, locationId]);

  return cameraDefaultPosition;
};

export default useCameraPosition;
