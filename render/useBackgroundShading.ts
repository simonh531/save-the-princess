import { gql, useQuery } from '@apollo/client';
import { useEffect, useRef, useState } from 'react';
import {
  CanvasTexture, Scene, WebGLCubeRenderTarget, WebGLRenderer, sRGBEncoding,
} from 'three';
import Locations from '../locations';
import { LookupTable } from '../utils/interfaces';

const TIMELOCATION = gql`
  query GetTimeLocation {
    time,
    locationId,
  }
`;

async function loadImage(url:string):Promise<HTMLImageElement> {
  const image = new Image();
  image.src = url;
  return new Promise((resolve) => {
    image.onload = () => resolve(image);
  });
}

async function shadeBackground(
  lookupTable:LookupTable, data:Uint8ClampedArray,
):Promise<Uint8ClampedArray> {
  const lutWorker = new Worker(new URL('../workers/lut.js', import.meta.url));
  lutWorker.postMessage([lookupTable, data]);
  return new Promise((resolve) => {
    lutWorker.onmessage = (event) => {
      lutWorker.terminate();
      resolve(event.data);
    };
  });
}

function useBackgroundShading(
  renderer: WebGLRenderer | undefined,
  scene: Scene,
  lookupTables: Record<string, LookupTable>,
):boolean {
  const { data } = useQuery(TIMELOCATION);
  const backgroundRenderTarget = useRef(new WebGLCubeRenderTarget(0, {
    encoding: sRGBEncoding,
  }));
  const [backgroundImages, setBackgroundImages] = useState<
    Record<string, Record<string, HTMLCanvasElement>>
  >({});
  const [canvasCtx, setCanvasCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [canvasTexture, setCanvasTexture] = useState<CanvasTexture>();
  const [loaded, setLoaded] = useState(false);
  const {
    time, locationId,
  } = data;

  const { background } = Locations[locationId];

  useEffect(() => {
    if (!canvasCtx) {
      const canvas = document.createElement('canvas');
      setCanvasCtx(canvas.getContext('2d'));
      const newCanvasTexture = new CanvasTexture(canvas);
      newCanvasTexture.encoding = sRGBEncoding;
      setCanvasTexture(newCanvasTexture);
    }
    // eslint-disable-next-line no-param-reassign
    scene.background = backgroundRenderTarget.current.texture;
  }, [canvasCtx, scene]);

  useEffect(() => {
    async function loadBackground() {
      const image = await loadImage(background);
      const original = document.createElement('canvas');
      original.width = image.width;
      original.height = image.height;
      const ctx = original.getContext('2d');
      if (ctx) {
        ctx.drawImage(image, 0, 0);
        const imageData = ctx.getImageData(0, 0, image.width, image.height);
        const [sunsetData, nightData] = await Promise.all([
          shadeBackground(lookupTables.LateSunset, imageData.data),
          shadeBackground(lookupTables.nightfromday, imageData.data),
        ]);
        const sunset = document.createElement('canvas');
        sunset.width = image.width;
        sunset.height = image.height;
        const sunsetCtx = sunset.getContext('2d');
        if (sunsetCtx) {
          sunsetCtx.putImageData(new ImageData(sunsetData, image.width), 0, 0);
        }
        const night = document.createElement('canvas');
        night.width = image.width;
        night.height = image.height;
        const nightCtx = night.getContext('2d');
        if (nightCtx) {
          nightCtx.putImageData(new ImageData(nightData, image.width), 0, 0);
        }
        setBackgroundImages((init) => ({
          ...init,
          [background]: { original, sunset, night },
        }));
      }
    }

    if (background && !backgroundImages[background]) {
      loadBackground();
    }
  }, [background, backgroundImages, lookupTables.LateSunset, lookupTables.nightfromday]);

  useEffect(() => { // handle background shading
    setLoaded(false);
    if (
      renderer
      && canvasCtx
      && canvasTexture
      && backgroundRenderTarget
      && backgroundImages[background]
    ) {
      const dayTime = time % 24;
      const {
        original, sunset, night,
      } = backgroundImages[background];
      canvasCtx.canvas.width = original.width;
      canvasCtx.canvas.height = original.height;
      if (dayTime >= 6 && dayTime <= 18) { // sun time
        const fraction = (dayTime - 6) / 12;
        const strength = (1 - Math.sin(fraction * Math.PI));
        canvasCtx.drawImage(original, 0, 0);
        canvasCtx.globalCompositeOperation = 'source-over';
        canvasCtx.globalAlpha = strength;
        canvasCtx.drawImage(sunset, 0, 0);
      } else { // moon time
        const fraction = ((dayTime + 6) % 12) / 12;
        const strength = Math.sin(fraction * Math.PI) * 0.85;
        canvasCtx.drawImage(night, 0, 0);
        canvasCtx.globalCompositeOperation = 'darken';
        canvasCtx.globalAlpha = strength;
        const gradient = canvasCtx.createLinearGradient(0, 0, 0, canvasCtx.canvas.height);
        gradient.addColorStop(0, 'black');
        gradient.addColorStop(0.5, 'black');
        gradient.addColorStop(1, 'rgba(0,0,0,0.1)');
        canvasCtx.fillStyle = gradient;
        canvasCtx.fillRect(0, 0, canvasCtx.canvas.width, canvasCtx.canvas.height);
      }
      canvasTexture.needsUpdate = true;
      backgroundRenderTarget.current.setSize(canvasCtx.canvas.height, canvasCtx.canvas.height);
      backgroundRenderTarget.current.fromEquirectangularTexture(
        renderer, canvasTexture,
      );
      setLoaded(true);
    }
  }, [background, backgroundImages, canvasCtx, canvasTexture, renderer, time]);

  return loaded;
}

export default useBackgroundShading;
