import { LookupTable } from './interfaces';

const getDecimal = (number: number) => {
  const split = `${number}`.split('.');
  if (split[1]) {
    return parseFloat(`.${split[1]}`);
  }
  return 0;
};

const getIndexFromIndices = (indices:number[], value:number): number => {
  const scaledNumber = (value + 1) * 4 - 1; // 255 to 1023
  const wholeIndex = indices.findIndex(
    // is the last index and equal to 1023
    (index, i) => (i === indices.length - 1 && scaledNumber === index)
    || (scaledNumber >= index && scaledNumber < indices[i + 1]),
  );
  let decimal = 0;
  if (wholeIndex !== indices.length - 1) {
    decimal = (scaledNumber - indices[wholeIndex])
    / (indices[wholeIndex + 1] - indices[wholeIndex]);
  }

  return wholeIndex + decimal;
};

const colorToNumberArray = (value: string, multiplier: number) => {
  const values = value.split(' ');
  return values.map((valueString) => parseFloat(valueString) * multiplier);
};

const colorsToDelta = (color1:number[], color2:number[], decimal: number) => [
  (color2[0] - color1[0]) * decimal,
  (color2[1] - color1[1]) * decimal,
  (color2[2] - color1[2]) * decimal,
];

const addColors = (...args:number[][]) => args.reduce((color, newColor) => [
  color[0] + newColor[0],
  color[1] + newColor[1],
  color[2] + newColor[2],
], [0, 0, 0]);

const tetrahedralInterpolation = (
  lookupArray: number[][][][], r: number, g: number, b: number,
) => {
  const max = lookupArray.length - 1;

  const black = lookupArray[Math.floor(r)][Math.floor(g)][Math.floor(b)];
  const red = lookupArray[Math.min(Math.floor(r) + 1, max)][Math.floor(g)][Math.floor(b)];
  const green = lookupArray[Math.floor(r)][Math.min(Math.floor(g) + 1, max)][Math.floor(b)];
  const blue = lookupArray[Math.floor(r)][Math.floor(g)][Math.min(Math.floor(b) + 1, max)];
  const cyan = lookupArray[
    Math.floor(r)][Math.min(Math.floor(g) + 1, max)][Math.min(Math.floor(b) + 1, max)];
  const magenta = lookupArray[
    Math.min(Math.floor(r) + 1, max)][Math.floor(g)][Math.min(Math.floor(b) + 1, max)];
  const yellow = lookupArray[
    Math.min(Math.floor(r) + 1, max)][Math.min(Math.floor(g) + 1, max)][Math.floor(b)];
  const white = lookupArray[
    Math.min(Math.floor(r) + 1, max)][
    Math.min(Math.floor(g) + 1, max)][
    Math.min(Math.floor(b) + 1, max)];

  if (r > g) {
    if (g > b) { // r > g > b
      return addColors(
        black,
        colorsToDelta(black, red, getDecimal(r)),
        colorsToDelta(red, yellow, getDecimal(g)),
        colorsToDelta(yellow, white, getDecimal(b)),
      );
    }
    if (b > g) { // r > b > g
      return addColors(
        black,
        colorsToDelta(black, red, getDecimal(r)),
        colorsToDelta(magenta, white, getDecimal(g)),
        colorsToDelta(red, magenta, getDecimal(b)),
      );
    } // b > r > g and b = r > g
    return addColors(
      black,
      colorsToDelta(blue, magenta, getDecimal(r)),
      colorsToDelta(magenta, white, getDecimal(g)),
      colorsToDelta(black, blue, getDecimal(b)),
    );
  }
  if (b > g) { // b > g > r and b > g = r
    return addColors(
      black,
      colorsToDelta(cyan, white, getDecimal(r)),
      colorsToDelta(blue, cyan, getDecimal(g)),
      colorsToDelta(black, blue, getDecimal(b)),
    );
  }
  if (b > r) { // g > b > r and g = b > r
    return addColors(
      black,
      colorsToDelta(cyan, white, getDecimal(r)),
      colorsToDelta(black, green, getDecimal(g)),
      colorsToDelta(green, cyan, getDecimal(b)),
    );
  } // g > r > b and r = g = b
  return addColors(
    black,
    colorsToDelta(green, yellow, getDecimal(r)),
    colorsToDelta(black, green, getDecimal(g)),
    colorsToDelta(yellow, white, getDecimal(b)),
  );
};

export const makeLookupTable = async (url: string):Promise<LookupTable> => {
  const extension = url.split('.').pop() || 'error';
  const text = await (await (await fetch(url)).blob()).text();
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
  return {
    array: lookupTable,
    type: extension,
    indices,
  };
};

export default function colorLookup(
  lookupTable: LookupTable, data: Uint8ClampedArray,
):Uint8ClampedArray {
  const dimension = lookupTable.array.length;
  const newData = new Uint8ClampedArray(data.length);
  if (lookupTable.type === 'CUBE') {
    for (let i = 0; i < data.length; i += 4) {
      const rIndex = data[i] / dimension;
      const gIndex = data[i + 1] / dimension;
      const bIndex = data[i + 2] / dimension;

      const [newR, newG, newB] = tetrahedralInterpolation(
        lookupTable.array, rIndex, gIndex, bIndex,
      );
      newData[i] = Math.round(newR);
      newData[i + 1] = Math.round(newG);
      newData[i + 2] = Math.round(newB);
      newData[i + 3] = 255;
    }
  } else if (lookupTable.type === '3DL' && lookupTable.indices) {
    for (let i = 0; i < data.length; i += 4) {
      const rIndex = getIndexFromIndices(lookupTable.indices, data[i]);
      const gIndex = getIndexFromIndices(lookupTable.indices, data[i + 1]);
      const bIndex = getIndexFromIndices(lookupTable.indices, data[i + 2]);

      const [newR, newG, newB] = tetrahedralInterpolation(
        lookupTable.array, rIndex, gIndex, bIndex,
      ); // range 4095 to 255
      newData[i] = Math.round((newR + 1) / 16 - 1);
      newData[i + 1] = Math.round((newG + 1) / 16 - 1);
      newData[i + 2] = Math.round((newB + 1) / 16 - 1);
      newData[i + 3] = 255;
    }
  }
  return newData;
}
