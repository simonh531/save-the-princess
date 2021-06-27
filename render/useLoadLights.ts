/* eslint-disable no-param-reassign */
import { useCallback, useEffect, useState } from 'react';
import { gql, useQuery } from '@apollo/client';
import {
  Color, HemisphereLight, AmbientLight, DirectionalLight,
} from 'three';
import FastAverageColor from 'fast-average-color';
import Locations from '../locations';

const LOCATION = gql`
  query GetLocation {
    locationId,
  }
`;

const sourceToColor = async (source: string | number):Promise<Color> => {
  if (typeof source === 'string') {
    const fac = new FastAverageColor();
    return new Color((await fac.getColorAsync(source)).rgb);
  }
  return new Color(source);
};

const useLoadLights = (
  light:DirectionalLight,
  hemisphereLight:HemisphereLight,
  ambientLight:AmbientLight,
  cubeUnit: number,
):boolean => {
  const { data } = useQuery(LOCATION);
  const { locationId } = data;
  const [loaded, setLoaded] = useState(false);

  const loadAmbientLights = useCallback(async (): Promise<void> => {
    const location = Locations[locationId];
    const {
      skyLight, groundLight, background, mapDepth, mapWidth,
    } = location;

    const [skyColor, groundColor, backgroundColor] = await Promise.all([
      sourceToColor(skyLight),
      sourceToColor(groundLight),
      sourceToColor(background),
    ]);

    light.shadow.camera.top = (mapDepth * cubeUnit) / 2;
    light.shadow.camera.right = (mapWidth * cubeUnit) / 2;
    light.shadow.camera.bottom = -(mapDepth * cubeUnit) / 2;
    light.shadow.camera.left = -(mapWidth * cubeUnit) / 2;
    light.shadow.camera.updateProjectionMatrix();

    hemisphereLight.color = skyColor;
    hemisphereLight.groundColor = groundColor;
    ambientLight.color = backgroundColor;
    setLoaded(true);
  }, [ambientLight, cubeUnit, hemisphereLight, light.shadow.camera, locationId]);

  useEffect(() => {
    if (Locations[locationId]) {
      loadAmbientLights();
    }
  }, [locationId, loadAmbientLights]);

  return loaded;
};

export default useLoadLights;
