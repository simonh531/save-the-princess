/* eslint-disable no-param-reassign */
import { useEffect, useState } from 'react';
import { gql, useQuery } from '@apollo/client';
import {
  // MeshStandardMaterial,
  Vector3,
  PerspectiveCamera,
  Camera,
} from 'three';
import calcCameraPosition from './calcCameraPosition';
import Locations from '../locations';
import CharacterStats from '../data/characterStats';

const LOCATION_CHECKS = gql`
  query GetLocationChecks {
    locationId,
    checks,
  }
`;

// units are meters let's say
// const depth = 0.1;
// const cubeUnit = 3;

const useCameraPosition = (
  camera: PerspectiveCamera,
  dummyCamera: Camera,
):Vector3 | undefined => {
  const { data } = useQuery(LOCATION_CHECKS);
  const { locationId, checks } = data;
  const [cameraDefaultPosition, setCameraDefaultPosition] = useState<Vector3 | undefined>();

  useEffect(() => {
    const location = Locations[locationId];
    const {
      cameraAngle, cameraHorizontalRange, cameraVerticalRange,
    } = location;

    const cameraPosition = calcCameraPosition(
      Locations[locationId],
      CharacterStats[checks.identity].eyeHeight,
    );

    dummyCamera.userData = { cameraAngle, cameraHorizontalRange, cameraVerticalRange };

    setCameraDefaultPosition(cameraPosition);
    dummyCamera.position.copy(cameraPosition);
    camera.position.copy(cameraPosition);
    if (cameraAngle) {
      dummyCamera.rotation.setFromVector3(cameraAngle, 'YXZ');
      camera.rotation.setFromVector3(cameraAngle, 'YXZ');
    }
  }, [camera, checks.identity, dummyCamera, locationId]);

  return cameraDefaultPosition;
};

export default useCameraPosition;
