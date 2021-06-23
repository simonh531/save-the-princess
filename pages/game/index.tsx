import {
  FC, useState, useEffect, useRef,
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
import { useWindowSizeEffect } from '../../utils/hooks';

import useAnimationLoop from '../../render/useAnimationLoop';
import useMakeLookupTables from '../../render/useMakeLookupTables';

import GameGrid from '../../components/gameGrid';
import DialogueBox from '../../components/dialogueBox';
import MenuDrawer from '../../components/menuDrawer';
import ChoiceDrawer from '../../components/choiceDrawer';
import LocationDialogueButton from '../../components/locationDialogueButton';
import useSunMoon from '../../render/useSunMoon';
import useFilterBackground from '../../render/useFilterBackground';
import useLoadWalls from '../../render/useLoadWalls';
import useLoadEntities from '../../render/useLoadEntities';
import useLoadLights from '../../render/useLoadLights';
import useLoadPlanes from '../../render/useLoadPlanes';
import useBackgroundShading from '../../render/useBackgroundShading';
import useEnvMap from '../../render/useEnvMap';
import useFocusPositions from '../../render/useFocusPositions';

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

const defaultAction = () => () => { /* do nothing */ };

// units are meters let's say
const depth = 0.1;
const cubeUnit = 3;

const Game: FC = () => {
  const [advanceAction, setAdvanceAction] = useState<() => void>(defaultAction);
  const { loading, /* error, */ data } = useQuery(GAME_STATE);
  const [showFps, setShowFps] = useState(false);
  const { checks } = data;

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

  const lookupTables = useMakeLookupTables();
  const filteredBackgrounds = useFilterBackground(lookupTables);

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

  const cameraDefaultPosition = useLoadWalls(
    scene.current,
    camera.current,
    dummyCamera.current,
    directionalLight.current,
    cubeUnit,
    depth,
  );

  const gameEntities = useLoadEntities(
    scene.current,
    camera.current.position,
    !!cameraDefaultPosition,
    cubeUnit,
    depth,
  );

  const focusPositions = useFocusPositions(cubeUnit);
  const lightsLoaded = useLoadLights(hemisphereLight.current, ambientLight.current);

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
    !!cameraDefaultPosition
    && planesDone
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
