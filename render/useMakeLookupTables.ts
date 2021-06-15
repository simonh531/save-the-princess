import { useEffect, useState } from 'react';
import { makeLookupTable } from '../utils/colorLookup';
import { LookupTable } from '../utils/interfaces';

const useMakeLookupTables = (): Record<string, LookupTable> | undefined => {
  const [lookupTables, setLookupTables] = useState<Record<string, LookupTable> | undefined>();
  async function makeLookupTables() {
    const [nightfromday, LateSunset] = await Promise.all([
      makeLookupTable('/assets/nightfromday.CUBE'),
      makeLookupTable('/assets/LateSunset.3DL'),
    ]);
    setLookupTables({
      nightfromday,
      LateSunset,
    });
  }
  useEffect(() => { // write lookup table
    makeLookupTables();
  }, []);

  return lookupTables;
};

export default useMakeLookupTables;
