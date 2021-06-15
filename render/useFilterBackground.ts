import { useEffect, useState } from 'react';
import { gql, useQuery } from '@apollo/client';
import colorLookup from '../utils/colorLookup';
import { BackgroundVersions, LookupTable } from '../utils/interfaces';
import Locations from '../locations';

const LOCATION = gql`
  query GetLocation {
    locationId,
  }
`;

function useFilterBackground(
  lookupTables: Record<string, LookupTable> | undefined,
):Record<string, BackgroundVersions> {
  const { data } = useQuery(LOCATION);
  const { locationId } = data;
  const [
    filteredBackgrounds,
    setFilteredBackgrounds,
  ] = useState<Record<string, BackgroundVersions>>({});

  useEffect(() => {
    if (lookupTables
      && Locations[locationId]
      && Locations[locationId].background
      && !filteredBackgrounds[Locations[locationId].background]
    ) { // don't reload if already exists
      const { background } = Locations[locationId];
      const image = new Image();
      image.src = background;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      image.addEventListener('load', () => {
        canvas.width = image.width;
        canvas.height = image.height;
        if (ctx) {
          ctx.drawImage(image, 0, 0);
          const imageData = ctx.getImageData(0, 0, image.width, image.height);
          setFilteredBackgrounds({
            ...filteredBackgrounds,
            [background]: {
              default: new ImageData(imageData.data, imageData.width),
              sunset: new ImageData(
                colorLookup(lookupTables.LateSunset, imageData.data), imageData.width,
              ),
              night: new ImageData(
                colorLookup(lookupTables.nightfromday, imageData.data), imageData.width,
              ),
            },
          });
        }
      });
    }
  }, [lookupTables, locationId]);

  return filteredBackgrounds;
}

export default useFilterBackground;
