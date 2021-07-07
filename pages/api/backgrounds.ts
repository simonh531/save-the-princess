// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';
import colorLookup, { makeLookupTable } from '../../utils/colorLookup';

const [nightfromday, LateSunset] = [
  makeLookupTable('/nightfromday.CUBE'),
  makeLookupTable('/LateSunset.3DL'),
];

const backgrounds:Map<string, Record<string, Buffer>> = new Map();

const getBackgrounds = async (
  req: NextApiRequest, res: NextApiResponse,
):Promise<void> => {
  const { url, type } = req.query;
  const urlString = (url || '').toString();
  const typeString = (type || '').toString();
  const backgroundObject = backgrounds.get(urlString);
  if (backgroundObject && backgroundObject[typeString]) {
    res.status(200)
      .setHeader('Content-Type', 'image/png')
      .setHeader('Content-Length', backgroundObject[type.toString()].length)
      .send(backgroundObject[type.toString()]);
  } else {
    const [nightFromDay, lateSunset] = await Promise.all([nightfromday, LateSunset]);
    const png = fs.createReadStream(path.join(process.cwd(), 'public', urlString)).pipe(new PNG());
    if (png) {
      png.on('parsed', async () => {
        const resultHolder:Record<string, Buffer> = {
          original: PNG.sync.write(png),
        };
        const sunset = colorLookup(lateSunset, png.data);
        const night = colorLookup(nightFromDay, png.data);
        png.data = sunset;
        resultHolder.sunset = PNG.sync.write(png);
        png.data = night;
        resultHolder.night = PNG.sync.write(png);
        backgrounds.set(urlString, resultHolder);
        res.status(200)
          .setHeader('Content-Type', 'image/png')
          .setHeader('Content-Length', resultHolder[typeString].length)
          .send(resultHolder[typeString]);
      });
    } else {
      res.status(404).send('404');
    }
  }
};

export default getBackgrounds;
