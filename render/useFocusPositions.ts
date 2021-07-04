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

  useEffect(() => {
    const holder = { ...focusPositions };
    if (entities && entities.size) {
      entities.forEach((entity, id) => {
        const entityData = MeshData[entity.meshId];
        holder[id] = new Vector3(
          (entity.x - (mapWidth / 2) + 0.5) * cubeUnit,
          (entityData.height - cubeUnit) / 2,
          (entity.z - (mapDepth / 2) + 0.5) * cubeUnit,
        );
        if (entityData.cameraAdjustment) {
          holder[id].add(entityData.cameraAdjustment);
        }
      });
    }
    setFocusPositionsReturn(holder);
  }, [cubeUnit, entities, focusPositions, locationId, mapDepth, mapWidth]);

  return focusPositionsReturn;
};

export default useFocusPositions;
