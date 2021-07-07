import { gql, useQuery } from '@apollo/client';
import { useEffect, useRef, useState } from 'react';
import {
  CanvasTexture, Scene, WebGLCubeRenderTarget, WebGLRenderer, sRGBEncoding,
} from 'three';
import Locations from '../locations';

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

function useBackgroundShading(
  renderer: WebGLRenderer | undefined,
  scene: Scene,
):boolean {
  const { data } = useQuery(TIMELOCATION);
  const backgroundRenderTarget = useRef(new WebGLCubeRenderTarget(0, {
    encoding: sRGBEncoding,
  }));
  const [backgroundImages, setBackgroundImages] = useState<Record<string, HTMLImageElement>>();
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    async function loadBackground() {
      const [original, sunset, night] = await Promise.all([
        loadImage(`/api/backgrounds?url=${background}&type=original`),
        loadImage(`/api/backgrounds?url=${background}&type=sunset`),
        loadImage(`/api/backgrounds?url=${background}&type=night`),
      ]);
      setBackgroundImages({ original, sunset, night });
    }

    if (background) {
      loadBackground();
    } else {
      setBackgroundImages(undefined);
    }
  }, [background]);

  useEffect(() => { // handle background shading
    setLoaded(false);
    if (
      renderer
      && canvasCtx
      && canvasTexture
      && backgroundRenderTarget
      && backgroundImages
    ) {
      const dayTime = time % 24;
      const {
        original, sunset, night,
      } = backgroundImages;
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
  }, [backgroundImages, canvasCtx, canvasTexture, renderer, time]);

  return loaded;
}

export default useBackgroundShading;
