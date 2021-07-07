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

  const floorR = Math.floor(r);
  const floorG = Math.floor(g);
  const floorB = Math.floor(b);
  const upR = Math.min(floorR + 1, max);
  const upG = Math.min(floorG + 1, max);
  const upB = Math.min(floorB + 1, max);
  const black = lookupArray[floorR][floorG][floorB];
  // const red = lookupArray[upR][floorG][floorB];
  // const green = lookupArray[floorR][upG][floorB];
  // const blue = lookupArray[floorR][floorG][upB];
  // const cyan = lookupArray[floorR][upG][upB];
  // const magenta = lookupArray[upR][floorG][upB];
  // const yellow = lookupArray[upR][upG][floorB];
  const white = lookupArray[upR][upG][upB];

  if (r > g) {
    if (g > b) { // r > g > b
      const red = lookupArray[upR][floorG][floorB];
      const yellow = lookupArray[upR][upG][floorB];
      return addColors(
        black,
        colorsToDelta(black, red, getDecimal(r)),
        colorsToDelta(red, yellow, getDecimal(g)),
        colorsToDelta(yellow, white, getDecimal(b)),
      );
    }
    if (b > g) { // r > b > g
      const red = lookupArray[upR][floorG][floorB];
      const magenta = lookupArray[upR][floorG][upB];
      return addColors(
        black,
        colorsToDelta(black, red, getDecimal(r)),
        colorsToDelta(magenta, white, getDecimal(g)),
        colorsToDelta(red, magenta, getDecimal(b)),
      );
    } // b > r > g and b = r > g
    const blue = lookupArray[floorR][floorG][upB];
    const magenta = lookupArray[upR][floorG][upB];
    return addColors(
      black,
      colorsToDelta(blue, magenta, getDecimal(r)),
      colorsToDelta(magenta, white, getDecimal(g)),
      colorsToDelta(black, blue, getDecimal(b)),
    );
  }
  if (b > g) { // b > g > r and b > g = r
    const blue = lookupArray[floorR][floorG][upB];
    const cyan = lookupArray[floorR][upG][upB];
    return addColors(
      black,
      colorsToDelta(cyan, white, getDecimal(r)),
      colorsToDelta(blue, cyan, getDecimal(g)),
      colorsToDelta(black, blue, getDecimal(b)),
    );
  }
  if (b > r) { // g > b > r and g = b > r
    const green = lookupArray[floorR][upG][floorB];
    const cyan = lookupArray[floorR][upG][upB];
    return addColors(
      black,
      colorsToDelta(cyan, white, getDecimal(r)),
      colorsToDelta(black, green, getDecimal(g)),
      colorsToDelta(green, cyan, getDecimal(b)),
    );
  } // g > r > b and r = g = b
  const green = lookupArray[floorR][upG][floorB];
  const yellow = lookupArray[upR][upG][floorB];
  return addColors(
    black,
    colorsToDelta(green, yellow, getDecimal(r)),
    colorsToDelta(black, green, getDecimal(g)),
    colorsToDelta(yellow, white, getDecimal(b)),
  );
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
