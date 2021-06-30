/* eslint-disable no-param-reassign */
import { gql, useQuery } from '@apollo/client';
import { useEffect, useState } from 'react';
import {
  AmbientLight, Color, DirectionalLight, Vector3,
} from 'three';
import Locations from '../locations';

const TIME_LOCATION = gql`
  query GetGameState {
    locationId,
    time,
  }
`;

const minLightStrength = 0.05;

const useSunMoon = (
  directionalLight: DirectionalLight,
  ambientLight: AmbientLight,
  directionalLightTarget: { position: Vector3; color: Color; },
  cubeUnit: number,
): void => {
  const { data } = useQuery(TIME_LOCATION);
  const { locationId, time } = data;
  const [isDay, setIsDay] = useState(true);

  useEffect(() => {
    if (Locations[locationId]) {
      const { mapDepth, mapWidth } = Locations[locationId];

      directionalLight.shadow.camera.top = (mapDepth * cubeUnit) / 2;
      directionalLight.shadow.camera.right = (mapWidth * cubeUnit) / 2;
      directionalLight.shadow.camera.bottom = -(mapDepth * cubeUnit) / 2;
      directionalLight.shadow.camera.left = -(mapWidth * cubeUnit) / 2;
      directionalLight.shadow.camera.updateProjectionMatrix();
    }
  }, [cubeUnit, directionalLight.shadow.camera, locationId]);

  useEffect(() => { // handle sun/moon position/strength
    const dayTime = time % 24;
    const lightStrengthFraction = dayTime / 24;
    const lightStrength = minLightStrength
      + (0.6 - minLightStrength) * Math.sin(lightStrengthFraction * Math.PI);
    const origin = directionalLight.target.position.clone();
    if (dayTime >= 6 && dayTime <= 18) { // sun time
      setIsDay(true);
      directionalLight.intensity = lightStrength;
      const fraction = (dayTime - 6) / 12;
      const blueStrength = (Math.sin(fraction * Math.PI) * 1.2) - 1; // range 0.2 to -1
      const r = Math.min(1 - blueStrength, 1);
      const g = 1 - Math.abs(blueStrength) / 2;
      const b = Math.min(1 + blueStrength, 1);
      origin.add(new Vector3(
        Math.cos(fraction * Math.PI) * 10,
        Math.sin(fraction * Math.PI) * 10 + 0.01, // 0.01 so you can still see shadows at sunset
        0,
      ));
      directionalLightTarget.position.copy(origin);
      directionalLightTarget.color.setRGB(r, g, b);
      if (!isDay) { // teleport the light to change to moon
        directionalLight.position.set(10, 0.01, 0); // start point
        directionalLight.color.setRGB(r, g, b);
      }
    } else { // moon time
      setIsDay(false);
      directionalLight.intensity = minLightStrength; // moon always gets the same amount of sun
      directionalLightTarget.color.setHex(0xffffff);
      directionalLight.color.setHex(0xffffff);
      const fraction = ((dayTime + 6) % 12) / 12;
      origin.add(new Vector3(
        Math.cos(fraction * Math.PI) * 10,
        Math.sin(fraction * Math.PI) * 10,
        0,
      ));
      directionalLightTarget.position.copy(origin);
      if (isDay) { // teleport the light to change to sun
        directionalLight.position.set(10, 0.01, 0); // start point;
      }
    }
    ambientLight.intensity = lightStrength * 0.4;
  }, [
    ambientLight, directionalLight, directionalLightTarget,
    isDay, time,
  ]); // isDay will never change while time remains the same
};

export default useSunMoon;
