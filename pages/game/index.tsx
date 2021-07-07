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
  AmbientLight,
  Color,
  sRGBEncoding,
} from 'three';
import { useWindowSizeEffect } from '../../utils/hooks';

import GameGrid from '../../components/gameGrid';
import DialogueBox from '../../components/dialogueBox';
import MenuDrawer from '../../components/menuDrawer';
import ChoiceDrawer from '../../components/choiceDrawer';
import LocationDialogueButton from '../../components/locationDialogueButton';
import useAnimationLoop from '../../render/useAnimationLoop';
import useSunMoon from '../../render/useSunMoon';
import useLoadWalls from '../../render/useLoadWalls';
import useLoadEntities from '../../render/useLoadEntities';
import useLoadPlanes from '../../render/useLoadPlanes';
import useBackgroundShading from '../../render/useBackgroundShading';
import useEnvMap from '../../render/useEnvMap';
import useFocusPositions from '../../render/useFocusPositions';
import useCameraPosition from '../../render/useCameraPosition';
import makeLookupTable from '../../utils/makeLookupTable';
import { LookupTable } from '../../utils/interfaces';

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
const cubeUnit = 3;

const Game:FC<{lookupTables:Record<string, LookupTable>}> = ({ lookupTables }) => {
  const [advanceAction, setAdvanceAction] = useState(() => () => { /* do nothing */ });
  const [showFps, setShowFps] = useState(false);

  // initializable -- no need to update
  const scene = useRef(new Scene());
  const camera = useRef(new PerspectiveCamera());
  const dummyCamera = useRef(new Camera());
  const ambientLight = useRef(new AmbientLight(0xffffff, 0));
  const directionalLight = useRef(new DirectionalLight(0xffffff, 0));
  const directionalLightTarget = useRef({ position: new Vector3(), color: new Color() });

  // need to update
  const [renderer, setRenderer] = useState<WebGLRenderer>();

  const gameArea = useRef<HTMLDivElement | null>(null);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const [isTalking, setIsTalking] = useState(false);

  useEffect(() => { // initialization
    if (!renderer && canvas.current) {
      const newRenderer = new WebGLRenderer({
        canvas: canvas.current,
        premultipliedAlpha: false,
      });
      newRenderer.gammaFactor = 2.2; // deprecated?
      newRenderer.outputEncoding = sRGBEncoding;
      newRenderer.shadowMap.enabled = true;
      setRenderer(newRenderer);
    }
    directionalLight.current.castShadow = true;
    directionalLight.current.shadow.mapSize.height = 2048;
    directionalLight.current.shadow.mapSize.width = 2048;

    scene.current.add(directionalLight.current);
    scene.current.add(ambientLight.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const focusPositions = useFocusPositions();
  const cameraDefaultPosition = useCameraPosition(camera.current, dummyCamera.current);

  const planesDone = useLoadPlanes(scene.current);
  const wallsDone = useLoadWalls(scene.current);
  const [gameEntities, gameEntitiesLoaded, mixerQueue] = useLoadEntities(scene.current);

  useSunMoon(
    directionalLight.current,
    ambientLight.current,
    directionalLightTarget.current,
    cubeUnit,
  );
  const backgroundShaded = useBackgroundShading(renderer, scene.current, lookupTables);

  useWindowSizeEffect((width, height) => { // set canvas width and height
    camera.current.aspect = width / height;
    camera.current.updateProjectionMatrix();
    if (renderer) {
      renderer.setSize(width, height);
    }
  }, [renderer]);

  useEffect(() => { // handle keyboard
    function handleKeydown(event:KeyboardEvent) {
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
          setShowFps((prevValue) => !prevValue);
          break;
        default:
          break;
      }
    }
    if (gameArea.current) {
      const game = gameArea.current;
      game.addEventListener('keydown', handleKeydown);
      return () => game.removeEventListener('keydown', handleKeydown);
    }
    return () => { /* do nothing */ };
  }, [advanceAction]);

  const fps = useAnimationLoop(
    gameArea.current,
    renderer,
    scene.current,
    camera.current,
    dummyCamera.current,
    directionalLight.current,
    directionalLightTarget.current,
    ambientLight.current,
    gameEntities,
    mixerQueue,
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
    && gameEntitiesLoaded
    && backgroundShaded,
  );

  return (
    <GameArea tabIndex={0} ref={gameArea}>
      <canvas ref={canvas} />
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

export async function getStaticProps(): Promise<{
  props: {
    lookupTables: Record<string, LookupTable>;
  };
}> {
  const [nightfromday, LateSunset] = await Promise.all([
    makeLookupTable('/nightfromday.CUBE'),
    makeLookupTable('/LateSunset.3DL'),
  ]);
  return {
    props: {
      lookupTables: {
        nightfromday,
        LateSunset,
      },
    },
  };
}
