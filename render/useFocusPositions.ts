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

const useFocusPositions = (
  cubeUnit: number, // possibly moved to location file
):Record<string, Vector3> | undefined => {
  const { data } = useQuery(LOCATION);
  const { locationId } = data;
  const [
    focusPositionsReturn, setFocusPositionsReturn,
  ] = useState<Record<string, Vector3> | undefined>();

  const location = Locations[locationId];
  const {
    entities, focusPositions, mapWidth, mapDepth,
  } = location;
  const holder = { ...focusPositions };

  useEffect(() => {
    if (entities && entities.length) {
      entities.forEach((entity) => {
        if (entity.focusPositionId) {
          const entityData = MeshData[entity.meshId];
          holder[entity.focusPositionId] = new Vector3(
            (entity.x - (mapWidth / 2) + 0.5) * cubeUnit,
            (entityData.height - cubeUnit) / 2,
            (entity.z - (mapDepth / 2) + 0.5) * cubeUnit,
          );
          if (entityData.cameraAdjustment) {
            holder[entity.focusPositionId].add(entityData.cameraAdjustment);
          }
        }
      });
    }
    setFocusPositionsReturn(holder);
  }, [locationId]);

  return focusPositionsReturn;
};

export default useFocusPositions;
