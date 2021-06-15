/* eslint-disable no-param-reassign */
import { useEffect, useState } from 'react';
import { gql, useQuery } from '@apollo/client';
import { Color, HemisphereLight, AmbientLight } from 'three';
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
  hemisphereLight:HemisphereLight,
  ambientLight:AmbientLight,
):boolean => {
  const { data } = useQuery(LOCATION);
  const { locationId } = data;
  const [loaded, setLoaded] = useState(false);

  async function loadAmbientLights(): Promise<void> {
    const location = Locations[locationId];
    const { skyLight, groundLight, background } = location;

    const [skyColor, groundColor, backgroundColor] = await Promise.all([
      sourceToColor(skyLight),
      sourceToColor(groundLight),
      sourceToColor(background),
    ]);
    hemisphereLight.color = skyColor;
    hemisphereLight.groundColor = groundColor;
    ambientLight.color = backgroundColor;
    setLoaded(true);
  }

  useEffect(() => {
    if (Locations[locationId]) {
      loadAmbientLights();
    }
  }, [locationId]);

  return loaded;
};

export default useLoadLights;
