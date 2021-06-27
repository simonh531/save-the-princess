import {
  FC, useState, useEffect, useRef, useMemo,
} from 'react';
import styled from 'styled-components';
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Camera,
  Vector3,
  DirectionalLight,
  HemisphereLight,
  AmbientLight,
  Color,
  sRGBEncoding,
  Material,
} from 'three';
import { useQuery, gql } from '@apollo/client';
import path from 'path';
import fs from 'fs';
// import zlib from 'zlib';
import JSONB from 'json-buffer';
import { PNG } from 'pngjs';
import { useWindowSizeEffect } from '../../utils/hooks';
import locationList from '../../locations';

import GameGrid from '../../components/gameGrid';
import DialogueBox from '../../components/dialogueBox';
import MenuDrawer from '../../components/menuDrawer';
import ChoiceDrawer from '../../components/choiceDrawer';
import LocationDialogueButton from '../../components/locationDialogueButton';
import useAnimationLoop from '../../render/useAnimationLoop';
import useSunMoon from '../../render/useSunMoon';
import useLoadWalls from '../../render/useLoadWalls';
import useLoadEntities from '../../render/useLoadEntities';
import useLoadLights from '../../render/useLoadLights';
import useLoadPlanes from '../../render/useLoadPlanes';
import useBackgroundShading from '../../render/useBackgroundShading';
import useEnvMap from '../../render/useEnvMap';
import useFocusPositions from '../../render/useFocusPositions';
import useCameraPosition from '../../render/useCameraPosition';
import colorLookup, { makeLookupTable } from '../../utils/colorLookup';
import { CompressedFilteredBackground, FilteredBackground } from '../../utils/interfaces';

const GAME_STATE = gql`
  query GetGameState {
    dialogueId,
    focusId,
    locationId,
    time,
    checks,
  }
`;

const GameArea = styled.main`
  height: 100vh;
  width: 100vw;
  overflow:hidden;
`;

const FPS = styled.span`
  position: absolute;
  top: 0;
  left: 0;
  color: red;
`;

// units are meters let's say
const depth = 0.1;
const cubeUnit = 3;

const Game: FC<{
  compressedFilteredBackgrounds:Record<string, CompressedFilteredBackground>
}> = ({ compressedFilteredBackgrounds }) => {
  const [advanceAction, setAdvanceAction] = useState(() => () => { /* do nothing */ });
  const { loading, /* error, */ data } = useQuery(GAME_STATE);
  const [showFps, setShowFps] = useState(false);
  const { checks } = data;

  const filteredBackgrounds = useMemo(
    () => {
      const holder:Record<string, FilteredBackground> = {};
      Object.entries(compressedFilteredBackgrounds).forEach(([id, compressedData]) => {
        const {
          original: compressedOriginal,
          sunset: compressedSunset,
          night: compressedNight,
          width, height,
        } = compressedData;
        // const original = new Uint8ClampedArray(zlib.inflateSync(JSONB.parse(compressedOriginal)))
        // const sunset = new Uint8ClampedArray(zlib.inflateSync(JSONB.parse(compressedSunset)));
        // const night = new Uint8ClampedArray(zlib.inflateSync(JSONB.parse(compressedNight)));
        const test = JSONB.parse(compressedSunset);
        // checkBuffer(test);
        const original = new Uint8ClampedArray(JSONB.parse(compressedOriginal));
        const sunset = new Uint8ClampedArray(test);
        const night = new Uint8ClampedArray(JSONB.parse(compressedNight));
        holder[id] = {
          original,
          sunset,
          night,
          width,
          height,
        };
      });
      return holder;
    },
    [compressedFilteredBackgrounds],
  );

  // initializable -- no need to update
  const scene = useRef(new Scene());
  const camera = useRef(new PerspectiveCamera());
  const dummyCamera = useRef(new Camera());
  const ambientLight = useRef(new AmbientLight(0xffffff, 0));
  const hemisphereLight = useRef(new HemisphereLight(0xffffff, 0xffffff, 0));
  const directionalLight = useRef(new DirectionalLight(0xffffff, 0));
  const directionalLightTarget = useRef({ position: new Vector3(), color: new Color() });

  const transitionQueue = useRef<{type: string, value: number, material?: Material}[]>([]);

  // need to update
  const [renderer, setRenderer] = useState<WebGLRenderer>();

  const target = useRef<HTMLDivElement | null>(null);
  const [isTalking, setIsTalking] = useState(false);

  useEffect(() => { // initialization
    if (!renderer) {
      const newRenderer = new WebGLRenderer({
        premultipliedAlpha: false,
      });
      newRenderer.gammaFactor = 2.2; // deprecated?
      newRenderer.outputEncoding = sRGBEncoding;
      newRenderer.shadowMap.enabled = true;
      if (target.current) {
        target.current.replaceChild(newRenderer.domElement, target.current.childNodes[0]);
      }
      setRenderer(newRenderer);
    }
    directionalLight.current.castShadow = true;
    directionalLight.current.shadow.mapSize.height = 2048;
    directionalLight.current.shadow.mapSize.width = 2048;

    scene.current.add(directionalLight.current);
    scene.current.add(hemisphereLight.current);
    scene.current.add(ambientLight.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const planesDone = useLoadPlanes(
    scene.current,
    cubeUnit,
    depth,
  );

  const wallsDone = useLoadWalls(
    scene.current,
    cubeUnit,
    depth,
  );

  const cameraDefaultPosition = useCameraPosition(camera.current, dummyCamera.current, cubeUnit);

  const gameEntities = useLoadEntities(
    scene.current,
    camera.current.position,
    !!cameraDefaultPosition,
    cubeUnit,
    depth,
  );

  const focusPositions = useFocusPositions(cubeUnit);
  const lightsLoaded = useLoadLights(
    directionalLight.current,
    hemisphereLight.current,
    ambientLight.current,
    cubeUnit,
  );

  useSunMoon(
    directionalLight.current, hemisphereLight.current, ambientLight.current,
    directionalLightTarget.current,
  );
  const backgroundShaded = useBackgroundShading(renderer, scene.current, filteredBackgrounds);

  useWindowSizeEffect((width, height) => { // set canvas width and height
    camera.current.aspect = width / height;
    camera.current.updateProjectionMatrix();
    if (renderer) {
      renderer.setSize(width, height);
    }
  }, [renderer]);

  useEffect(() => { // handle keyboard
    function handleKeydown(event:KeyboardEvent) {
      // console.log(event);
      switch (event.code) {
        case 'Space':
          advanceAction();
          break;
        case 'Enter':
          advanceAction();
          break;
        case 'ArrowRight':
          advanceAction();
          break;
        case 'Backquote':
          setShowFps(!showFps);
          break;
        default:
          break;
      }
    }
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [advanceAction, showFps]);

  // update entities based on checks
  useEffect(() => {
    if (gameEntities.length) {
      gameEntities.forEach((entity) => {
        if (entity.getVisibility) {
          if (entity.getVisibility()) {
            if (Array.isArray(entity.mesh.material) && entity.mesh.material[0].opacity === 0) {
              transitionQueue.current.push({
                type: 'opacity',
                value: 1,
                material: entity.mesh.material[0],
              });
            } else if (!Array.isArray(entity.mesh.material) && entity.mesh.material.opacity === 0) {
              transitionQueue.current.push({
                type: 'opacity',
                value: 1,
                material: entity.mesh.material,
              });
            }
          } else if (Array.isArray(entity.mesh.material) && entity.mesh.material[0].opacity === 1) {
            transitionQueue.current.push({
              type: 'opacity',
              value: 0,
              material: entity.mesh.material[0],
            });
          } else if (!Array.isArray(entity.mesh.material) && entity.mesh.material.opacity === 1) {
            transitionQueue.current.push({
              type: 'opacity',
              value: 0,
              material: entity.mesh.material,
            });
          }
        }
        entity.mesh.position.copy(entity.getPosition());
      });
    }
  }, [gameEntities, checks]);

  const fps = useAnimationLoop(
    renderer,
    scene.current,
    camera.current,
    dummyCamera.current,
    directionalLight.current,
    directionalLightTarget.current,
    gameEntities,
    transitionQueue,
    advanceAction,
    showFps,
    cameraDefaultPosition,
    focusPositions,
  );

  useEnvMap(
    renderer,
    scene.current,
    planesDone
    && wallsDone
    && lightsLoaded
    && !!gameEntities
    && backgroundShaded,
  );

  if (loading || !data) {
    return null;
  }

  return (
    <GameArea ref={target}>
      <div />
      {showFps && <FPS>{fps}</FPS>}
      <GameGrid>
        <DialogueBox
          setAdvance={setAdvanceAction}
          advance={advanceAction}
          setIsTalking={setIsTalking}
          isTalking={isTalking}
          camera={camera.current}
          focusPositions={focusPositions || {}}
        />
        <MenuDrawer />
        <ChoiceDrawer isTalking={isTalking} />
        <LocationDialogueButton />
      </GameGrid>
    </GameArea>
  );
};

export default Game;

// const asyncDeflate = async (buffer:Buffer) => new Promise<Buffer>((resolve, reject) => {
//   zlib.deflate(buffer, (error, data) => {
//     if (error) {
//       reject(error);
//     } else {
//       console.log(buffer.length, data.length);
//       resolve(data);
//     }
//   });
// });

export async function getStaticProps(): Promise<{
  props: {
    compressedFilteredBackgrounds: Record<string, CompressedFilteredBackground>;
  };
}> {
  const [nightfromday, LateSunset] = await Promise.all([
    makeLookupTable('/nightfromday.CUBE'),
    makeLookupTable('/LateSunset.3DL'),
  ]);
  const compressedFilteredBackgrounds:Record<string, CompressedFilteredBackground> = {};
  const values = await Promise.all([...Object.entries(locationList).map(([id, location]) => {
    const { background } = location;
    const png = fs.createReadStream(path.join(process.cwd(), 'public', background)).pipe(new PNG());
    return new Promise<[string, CompressedFilteredBackground]>((resolve) => {
      png.on('parsed', async () => {
        // const [original, sunset, night] = await Promise.all([
        //   asyncDeflate(png.data),
        //   asyncDeflate(colorLookup(LateSunset, png.data)),
        //   asyncDeflate(colorLookup(nightfromday, png.data)),
        // ]);
        const [original, sunset, night] = await Promise.all([
          png.data,
          colorLookup(LateSunset, png.data),
          colorLookup(nightfromday, png.data),
        ]);
        // console.log('sunset', ...checkBuffer(sunset));
        // console.log('night', ...checkBuffer(night));
        resolve([id, {
          original: JSONB.stringify(original),
          sunset: JSONB.stringify(sunset),
          night: JSONB.stringify(night),
          width: png.width,
          height: png.height,
        }]);
      });
    });
  })]);
  values.forEach(([id, filteredBackground]) => {
    compressedFilteredBackgrounds[id] = filteredBackground;
  });
  return {
    props: {
      compressedFilteredBackgrounds,
    },
  };
}
