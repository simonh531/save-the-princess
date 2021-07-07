import colorLookup from '../utils/colorLookup';

onmessage = (event) => {
  const [lookupTable, png] = event.data;

  postMessage(colorLookup(lookupTable, png));
};
