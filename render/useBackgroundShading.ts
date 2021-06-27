import { gql, useQuery } from '@apollo/client';
import { useEffect, useRef, useState } from 'react';
import {
  CanvasTexture, Scene, WebGLCubeRenderTarget, WebGLRenderer, sRGBEncoding,
} from 'three';
import { FilteredBackground } from '../utils/interfaces';

const TIMELOCATION = gql`
  query GetTimeLocation {
    time,
    locationId,
  }
`;

function useBackgroundShading(
  renderer: WebGLRenderer | undefined,
  scene: Scene,
  filteredBackgrounds: Record<string, FilteredBackground>,
):boolean {
  const { data } = useQuery(TIMELOCATION);
  const backgroundRenderTarget = useRef(new WebGLCubeRenderTarget(0));
  const [canvasCtx, setCanvasCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [canvasTexture, setCanvasTexture] = useState<CanvasTexture>();
  const [loaded, setLoaded] = useState(false);
  const {
    time, locationId,
  } = data;

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
  }, [scene]);

  useEffect(() => { // handle background shading
    setLoaded(false);
    if (
      renderer
      && canvasCtx
      && canvasTexture
      && backgroundRenderTarget
      && filteredBackgrounds[locationId]
    ) {
      const dayTime = time % 24;
      const {
        original, sunset, night, width, height,
      } = filteredBackgrounds[locationId];
      canvasCtx.canvas.width = width;
      canvasCtx.canvas.height = height;
      if (dayTime >= 6 && dayTime <= 18) { // sun time
        const fraction = (dayTime - 6) / 12;
        const strength = (1 - Math.sin(fraction * Math.PI));
        canvasCtx.putImageData(new ImageData(original, width), 0, 0);
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCanvas.width = canvasCtx.canvas.width;
          tempCanvas.height = canvasCtx.canvas.height;
          tempCtx.putImageData(new ImageData(sunset, width), 0, 0);
          canvasCtx.globalCompositeOperation = 'source-over';
          canvasCtx.globalAlpha = strength;
          canvasCtx.drawImage(tempCanvas, 0, 0);
        }
        canvasTexture.needsUpdate = true;
        backgroundRenderTarget.current.setSize(canvasCtx.canvas.height, canvasCtx.canvas.height);
        backgroundRenderTarget.current.fromEquirectangularTexture(
          renderer, canvasTexture,
        );
      } else { // moon time
        const fraction = ((dayTime + 6) % 12) / 12;
        const strength = Math.sin(fraction * Math.PI) * 0.85;
        canvasCtx.putImageData(new ImageData(night, width), 0, 0);
        canvasCtx.globalCompositeOperation = 'darken';
        canvasCtx.globalAlpha = strength;
        const gradient = canvasCtx.createLinearGradient(0, 0, 0, canvasCtx.canvas.height);
        gradient.addColorStop(0, 'black');
        gradient.addColorStop(0.5, 'black');
        gradient.addColorStop(1, 'rgba(0,0,0,0.1)');
        canvasCtx.fillStyle = gradient;
        canvasCtx.fillRect(0, 0, canvasCtx.canvas.width, canvasCtx.canvas.height);
        canvasTexture.needsUpdate = true;
        backgroundRenderTarget.current.setSize(canvasCtx.canvas.height, canvasCtx.canvas.height);
        backgroundRenderTarget.current.fromEquirectangularTexture(
          renderer, canvasTexture,
        );
      }
      setLoaded(true);
    }
  }, [
    renderer, canvasCtx, canvasTexture, backgroundRenderTarget,
    time, locationId, filteredBackgrounds,
  ]);

  return loaded;
}

export default useBackgroundShading;
