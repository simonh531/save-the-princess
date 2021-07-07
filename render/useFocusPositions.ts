import { useEffect, useState } from 'react';
import { gql, useQuery } from '@apollo/client';
import { Vector3 } from 'three';
import Locations from '../locations';
import MeshData from '../meshData';

const LOCATION = gql`
  query GetLocation {
    locationId,
  }
`;

const useFocusPositions = ():Record<string, Vector3> | undefined => {
  const { data } = useQuery(LOCATION);
  const { locationId } = data;
  const [
    focusPositionsReturn, setFocusPositionsReturn,
  ] = useState<Record<string, Vector3> | undefined>();

  const location = Locations[locationId];
  const {
    entities, focusPositions, mapWidth, mapHeight, mapDepth,
  } = location;

  useEffect(() => {
    const holder = { ...focusPositions };
    if (entities && entities.size) {
      entities.forEach((entity, id) => {
        const {
          x, y = 0, z, meshId,
        } = entity;
        const { height, cameraAdjustment } = MeshData[meshId];
        holder[id] = new Vector3(
          x - mapWidth / 2,
          (y + height - mapHeight) / 2,
          z - mapDepth / 2,
        );
        if (cameraAdjustment) {
          holder[id].add(cameraAdjustment);
        }
      });
    }
    setFocusPositionsReturn(holder);
  }, [entities, focusPositions, locationId, mapDepth, mapHeight, mapWidth]);

  return focusPositionsReturn;
};

export default useFocusPositions;
