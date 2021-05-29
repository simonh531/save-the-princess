const getDecimal = (number: number) => {
  const split = `${number}`.split('.');
  if (split[1]) {
    return parseFloat(`.${split[1]}`);
  }
  return 0;
};

const colorToNumberArray = (value: string) => {
  const values = value.split(' ');
  return values.map((valueString) => parseFloat(valueString) * 255);
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

export const makeLookupArray = async (url: string):Promise<number[][][][]> => {
  const text = await (await (await fetch(url)).blob()).text();
  const textLines = text.split('\n');
  const dimension = parseInt(
    textLines[5].match(/\d+$/g)?.toString() || '0', 10,
  );
  const lookupArray = new Array(dimension);
  // the reason I decide to parse it here is because parsing 17^3
  // times is better than parsing 4 * 1000 * 500 times for an image
  for (let i = 0; i < dimension; i += 1) {
    const newArray = new Array(dimension);
    newArray[0] = new Array(dimension);
    newArray[0][0] = colorToNumberArray(textLines[i + 12]);
    lookupArray[i] = newArray;
  }
  for (let i = dimension; i < dimension * dimension; i += 1) {
    const newArray = new Array(dimension);
    newArray[0] = colorToNumberArray(textLines[i + 12]);
    lookupArray[i % dimension][Math.floor(i / dimension)] = newArray;
  }
  for (let i = dimension * dimension; i + 12 < textLines.length; i += 1) {
    lookupArray[
      i % dimension][
      Math.floor(i / dimension) % dimension][
      Math.floor(i / dimension / dimension)] = colorToNumberArray(textLines[i + 12]);
  }
  return lookupArray;
};

export default function colorLookup(
  lookupArray: number[][][][], data: Uint8ClampedArray, strength: number,
):Uint8ClampedArray {
  let newData;
  if (strength === 0) {
    newData = data;
  } else {
    const dimension = lookupArray.length;
    newData = new Uint8ClampedArray(data.length);
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] / dimension;
      const g = data[i + 1] / dimension;
      const b = data[i + 2] / dimension;

      const newColor = tetrahedralInterpolation(lookupArray, r, g, b);

      if (strength === 1) {
        const [newR, newG, newB] = newColor;
        newData[i] = Math.round(newR);
        newData[i + 1] = Math.round(newG);
        newData[i + 2] = Math.round(newB);
        newData[i + 3] = 255;
      } else { // strength is a decimal
        const origColor = [data[i], data[i + 1], data[i + 2]];
        const [newR, newG, newB] = addColors(
          origColor,
          colorsToDelta(origColor, newColor, strength),
        );
        newData[i] = Math.round(newR);
        newData[i + 1] = Math.round(newG);
        newData[i + 2] = Math.round(newB);
        newData[i + 3] = 255;
      }
    }
  }
  return newData;
}
