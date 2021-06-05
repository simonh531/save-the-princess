import {
  FC, useState, useEffect, useRef,
} from 'react';
import styled from 'styled-components';
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  WebGLCubeRenderTarget,
  Camera,
  Vector3,
  DirectionalLight,
  HemisphereLight,
  AmbientLight,
  CanvasTexture,
} from 'three';
import { useQuery, gql } from '@apollo/client';
import { useWindowSizeEffect } from '../../utils/hooks';
import {
  BackgroundVersions, GameEntity, Location, LookupTable,
} from '../../utils/interfaces';
import { makeLookupTable } from '../../utils/colorLookup';
import Locations from '../../locations';

import useLoadLocation from '../../render/useLoadLocation';
import useAnimationLoop from '../../render/useAnimationLoop';

import GameGrid from '../../components/gameGrid';
import DialogueBox from '../../components/dialogueBox';
import MenuDrawer from '../../components/menuDrawer';
import ChoiceDrawer from '../../components/choiceDrawer';
import LocationDialogueButton from '../../components/locationDialogueButton';

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

const defaultAction = () => () => { /* do nothing */ };

const defaultLocation:Location = {
  background: '',
  groundLightTexture: '',
  skyLightTexture: '',
  walls: {
    plan: '',
    tiles: {},
  },
  horizontalPlanes: [],
};

// units are meters let's say
const depth = 0.1;
const cubeUnit = 3;

const Game: FC = () => {
  const [advanceAction, setAdvanceAction] = useState<() => void>(defaultAction);
  const { loading, /* error, */ data } = useQuery(GAME_STATE);
  let location:Location = defaultLocation;
  const {
    focusId, locationId, time, checks,
  } = data;

  if (locationId && Locations[locationId]) {
    location = Locations[locationId];
  }
  // initializable -- no need to update
  const scene = useRef(new Scene());
  const [cameraDefaultPosition, setCameraDefaultPosition] = useState(new Vector3());
  const camera = useRef(new PerspectiveCamera());
  const dummyCamera = useRef(new Camera());
  const [gameEntities, setGameEntities] = useState<Record<string, GameEntity>>({});
  const ambientLight = useRef(new AmbientLight(0xffffff, 0));
  const hemisphereLight = useRef(new HemisphereLight(0xffffff, 0xffffff, 0));
  const directionalLight = useRef(new DirectionalLight(0xffffff, 0));
  const backgroundRenderTarget = useRef(new WebGLCubeRenderTarget(0));

  // need to update
  const [renderer, setRenderer] = useState<WebGLRenderer>();
  const [canvasCtx, setCanvasCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [canvasTexture, setCanvasTexture] = useState<CanvasTexture>();
  const [lookupTables, setLookupTables] = useState<Record<string, LookupTable>>({});
  const [
    filteredBackgrounds,
    setFilteredBackgrounds,
  ] = useState<Record<string, BackgroundVersions>>({});

  const target = useRef<HTMLDivElement | null>(null);
  const [isTalking, setIsTalking] = useState(false);

  useEffect(() => { // write lookup table
    async function makeLookupTables() {
      setLookupTables({
        nightfromday: await makeLookupTable('/assets/nightfromday.CUBE'),
        LateSunset: await makeLookupTable('/assets/LateSunset.3DL'),
      });
    }
    makeLookupTables();
  }, []);

  useEffect(() => { // initialization
    if (!renderer) {
      const newRenderer = new WebGLRenderer();
      newRenderer.shadowMap.enabled = true;
      if (target.current) {
        target.current.replaceChild(newRenderer.domElement, target.current.childNodes[0]);
      }
      setRenderer(newRenderer);
    }
    directionalLight.current.castShadow = true;
    directionalLight.current.shadow.mapSize.height = 1024;
    directionalLight.current.shadow.mapSize.width = 1024;

    if (!canvasCtx) {
      const canvas = document.createElement('canvas');
      setCanvasCtx(canvas.getContext('2d'));
      setCanvasTexture(new CanvasTexture(canvas));
    }

    scene.current.add(directionalLight.current);
    scene.current.add(directionalLight.current.target);
    scene.current.background = backgroundRenderTarget.current.texture;
  }, []);

  useLoadLocation(
    scene.current,
    location,
    setCameraDefaultPosition,
    camera.current,
    dummyCamera.current,
    directionalLight.current,
    setGameEntities,
    ambientLight.current,
    hemisphereLight.current,
    cubeUnit,
    depth,
    lookupTables,
    filteredBackgrounds,
    setFilteredBackgrounds,
  );

  useEffect(() => { // handle sun/moon position/strength
    const dayTime = time % 24;
    const lightStrengthFraction = dayTime / 24;
    const lightStrength = 0.12 + 0.48 * Math.sin(lightStrengthFraction * Math.PI);
    const origin = directionalLight.current.target.position.clone();
    if (dayTime >= 6 && dayTime <= 18) { // sun time
      directionalLight.current.intensity = lightStrength;
      const fraction = (dayTime - 6) / 12;
      const blueStrength = (Math.sin(fraction * Math.PI) * 1.2) - 1; // range 0.2 to -1
      const r = Math.min(1 - blueStrength, 1);
      const g = 1 - Math.abs(blueStrength) / 2;
      const b = Math.min(1 + blueStrength, 1);
      directionalLight.current.color.setRGB(r, g, b);
      origin.add(new Vector3(
        Math.cos(fraction * Math.PI) * 10,
        Math.sin(fraction * Math.PI) * 10 + 0.1, // 0.1 so you can still see at sunset
        0,
      ));
      directionalLight.current.position.copy(origin);
    } else { // moon time
      directionalLight.current.intensity = 0.05; // moon always gets the same amount of sun
      directionalLight.current.color.setHex(0xffffff);
      const fraction = ((dayTime + 6) % 12) / 12;
      origin.add(new Vector3(
        Math.cos(fraction * Math.PI) * 10,
        Math.sin(fraction * Math.PI) * 10,
        0,
      ));
      directionalLight.current.position.copy(origin);
    }
    hemisphereLight.current.intensity = lightStrength * 0.9;
    ambientLight.current.intensity = lightStrength * 0.8;
  }, [time]);
  useEffect(() => { // handle background shading
    if (canvasCtx && canvasTexture && renderer) {
      const dayTime = time % 24;
      if (dayTime >= 6 && dayTime <= 18) { // sun time
        const fraction = (dayTime - 6) / 12;
        const strength = (1 - Math.sin(fraction * Math.PI));
        canvasCtx.canvas.width = filteredBackgrounds[location.background].night.width;
        canvasCtx.canvas.height = filteredBackgrounds[location.background].night.height;
        canvasCtx.putImageData(
          filteredBackgrounds[location.background].default,
          0, 0,
        );
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCanvas.width = canvasCtx.canvas.width;
          tempCanvas.height = canvasCtx.canvas.height;
          tempCtx.putImageData(
            filteredBackgrounds[location.background].sunset,
            0, 0,
          );
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
        canvasCtx.canvas.width = filteredBackgrounds[location.background].night.width;
        canvasCtx.canvas.height = filteredBackgrounds[location.background].night.height;
        canvasCtx.putImageData(
          filteredBackgrounds[location.background].night,
          0, 0,
        );
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
    }
  }, [time, filteredBackgrounds[location.background]]);

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
        default:
          break;
      }
    }
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [advanceAction]);

  useEffect(() => { // handle camera movement on focus change
    if (focusId && gameEntities[focusId]) { // second part necessary for refresh
      const { cameraAdjustment, mesh } = gameEntities[focusId];
      const focusPosition = mesh.position.clone();
      if (cameraAdjustment) {
        focusPosition.add(new Vector3(...cameraAdjustment));
      }
      // math
      const destination = cameraDefaultPosition.clone()
        .sub(focusPosition)
        .normalize()
        .multiplyScalar(2)
        .add(focusPosition);
      dummyCamera.current.position.copy(destination);
      dummyCamera.current.lookAt(focusPosition);
    } else {
      dummyCamera.current.position.copy(cameraDefaultPosition);
    }
  }, [focusId, cameraDefaultPosition, gameEntities]);

  // update entities based on checks
  useEffect(() => {
    Object.values(gameEntities).forEach((entity) => {
      if (entity.getVisibility) {
        // eslint-disable-next-line no-param-reassign
        entity.mesh.visible = entity.getVisibility();
      }
      entity.mesh.position.copy(entity.getPosition());
    });
  }, [checks]);

  useAnimationLoop(
    renderer,
    scene.current,
    camera.current,
    dummyCamera.current,
    gameEntities,
    advanceAction,
  );

  if (loading || !data) {
    return null;
  }

  return (
    <GameArea ref={target}>
      <div />
      <GameGrid>
        <DialogueBox
          setAdvance={setAdvanceAction}
          advance={advanceAction}
          setIsTalking={setIsTalking}
          isTalking={isTalking}
        />
        <MenuDrawer />
        <ChoiceDrawer isTalking={isTalking} />
        <LocationDialogueButton />
      </GameGrid>
    </GameArea>
  );
};

export default Game;
