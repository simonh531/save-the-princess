// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';
import locations from '../../locations';
import colorLookup, { makeLookupTable } from '../../utils/colorLookup';

async function loadBackgrounds():Promise<Map<string, Record<string, Buffer>>> {
  const holder = new Map();
  const [nightfromday, LateSunset] = await Promise.all([
    makeLookupTable('/nightfromday.CUBE'),
    makeLookupTable('/LateSunset.3DL'),
  ]);
  const uniqueBackgrounds = new Set(
    Object.values(locations).map((location) => location.background),
  );
  await Promise.all(Array.from(uniqueBackgrounds).map((url) => {
    const png = fs.createReadStream(path.join(process.cwd(), 'public', url)).pipe(new PNG());
    return new Promise<void>((resolve) => {
      png.on('parsed', async () => {
        const resultHolder:Record<string, Buffer> = {
          original: PNG.sync.write(png),
        };
        const sunset = colorLookup(LateSunset, png.data);
        const night = colorLookup(nightfromday, png.data);
        png.data = sunset;
        resultHolder.sunset = PNG.sync.write(png);
        png.data = night;
        resultHolder.night = PNG.sync.write(png);
        holder.set(url, resultHolder);
        resolve();
      });
    });
  }));

  return holder;
}

const backgroundsPromise = loadBackgrounds();

const getBackgrounds = async (
  req: NextApiRequest, res: NextApiResponse,
):Promise<void> => {
  const backgrounds = await backgroundsPromise;
  const { url, type } = req.query;

  const backgroundObject = backgrounds.get((url || '').toString());
  if (backgroundObject && backgroundObject[(type || '').toString()]) {
    res.status(200)
      .setHeader('Content-Type', 'image/png')
      .setHeader('Content-Length', backgroundObject[type.toString()].length)
      .send(backgroundObject[type.toString()]);
  } else {
    res.status(404).send('404');
  }
};

export default getBackgrounds;
