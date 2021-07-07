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

const backgrounds:Record<string, Record<string, Buffer>> = {};

const getBackgrounds = async (
  req: NextApiRequest, res: NextApiResponse,
):Promise<void> => {
  const { url, type } = req.query;
  const urlString = (url || '').toString();
  const typeString = (type || '').toString();
  if (backgrounds[urlString] && backgrounds[urlString][typeString]) {
    res.status(200)
      .setHeader('Content-Type', 'image/png')
      .setHeader('Content-Length', backgrounds[urlString][typeString].length)
      .send(backgrounds[urlString][typeString]);
  } else {
    const [nightFromDay, lateSunset] = await Promise.all([nightfromday, LateSunset]);
    const png = fs.createReadStream(path.join(process.cwd(), 'public', urlString)).pipe(new PNG());
    if (png) {
      png.on('parsed', async () => {
        if (typeString === 'original') {
          const result = PNG.sync.write(png);
          res.status(200)
            .setHeader('Content-Type', 'image/png')
            .setHeader('Content-Length', result.length)
            .send(result);
          backgrounds[urlString] = {
            ...backgrounds[urlString],
            original: result,
          };
        } else if (typeString === 'sunset') {
          const sunset = colorLookup(lateSunset, png.data);
          png.data = sunset;
          const result = PNG.sync.write(png);
          res.status(200)
            .setHeader('Content-Type', 'image/png')
            .setHeader('Content-Length', result.length)
            .send(result);
          backgrounds[urlString] = {
            ...backgrounds[urlString],
            sunset: result,
          };
        } else if (typeString === 'night') {
          const night = colorLookup(nightFromDay, png.data);
          png.data = night;
          const result = PNG.sync.write(png);
          res.status(200)
            .setHeader('Content-Type', 'image/png')
            .setHeader('Content-Length', result.length)
            .send(result);
          backgrounds[urlString] = {
            ...backgrounds[urlString],
            sunset: result,
          };
        } else {
          res.status(404).send('404');
        }
      });
    } else {
      res.status(404).send('404');
    }
  }
};

export default getBackgrounds;
