import { readFile } from 'fs/promises';
import path from 'path';
import { LookupTable } from './interfaces';

const colorToNumberArray = (value: string, multiplier: number) => {
  const values = value.split(' ');
  return values.map((valueString) => parseFloat(valueString) * multiplier);
};

const makeLookupTable = async (url: string):Promise<LookupTable> => {
  const extension = url.split('.').pop() || 'error';
  const text = await readFile(path.join(process.cwd(), 'public', 'assets', url), 'utf-8');

  const textLines = text.split('\n');
  let dimension = 17; // default
  let padding = 0;
  let multiplier = 1;
  let indices;
  if (extension === 'CUBE') {
    dimension = parseInt(
      textLines[5].split(' ')[1], 10,
    );
    padding = 12;
    multiplier = 255;
  } else if (extension === '3DL') {
    indices = textLines[2].split(' ').map((number) => parseInt(number, 10));
    dimension = indices.length;
    padding = 3;
    multiplier = 1;
  }
  const lookupTable = new Array(dimension);
  // the reason I decide to parse it here is because parsing 17^3
  // times is better than parsing 4 * 1000 * 500 times for an image
  for (let i = 0; i < dimension; i += 1) {
    const newArray = new Array(dimension);
    newArray[0] = new Array(dimension);
    newArray[0][0] = colorToNumberArray(textLines[i + padding], multiplier);
    lookupTable[i] = newArray;
  }
  for (let i = dimension; i < dimension * dimension; i += 1) {
    const newArray = new Array(dimension);
    newArray[0] = colorToNumberArray(textLines[i + padding], multiplier);
    lookupTable[i % dimension][Math.floor(i / dimension)] = newArray;
  }
  for (let i = dimension * dimension; i + padding < textLines.length; i += 1) {
    lookupTable[
      i % dimension][
      Math.floor(i / dimension) % dimension][
      Math.floor(i / dimension / dimension)] = colorToNumberArray(
      textLines[i + padding], multiplier,
    );
  }
  const holder:LookupTable = {
    array: lookupTable,
    type: extension,
  };
  if (indices) {
    holder.indices = indices;
  }
  return holder;
};

export default makeLookupTable;
