import {
  FC, useState, useEffect, useRef,
} from 'react';
import styled from 'styled-components';
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  WebGLCubeRenderTarget,
  Raycaster,
  Vector2,
  Euler,
  Camera,
  Vector3,
  DirectionalLight,
  HemisphereLight,
  AmbientLight,
  CanvasTexture,
  Mesh,
  Object3D,
} from 'three';
import { useQuery, gql } from '@apollo/client';

import {
  setFocus, setDialogue, unfocus,
} from '../../data/state';
import { useWindowSize, useMousePositionEffect } from '../../utils/hooks';
import {
  BackgroundVersions, Dialogue, Location, LookupTable,
} from '../../utils/interfaces';
import { loadLocation } from '../../utils/loaders';
import { makeLookupTable } from '../../utils/colorLookup';
import Locations from '../../locations';
import Dialogues from '../../dialogue';

import GameGrid from '../../components/gameGrid';
import DialogueBox from '../../components/dialogueBox';
import TopicsDrawer from '../../components/topicsDrawer';
import ItemsDrawer from '../../components/itemsDrawer';

const GAME_STATE = gql`
  query GetGameState {
    dialogueId,
    focusId,
    locationId,
    topics,
    items,
    time,
  }
`;

const GameArea = styled.main`
  height: 100vh;
  width: 100vw;
  overflow:hidden;
`;

const defaultAction = () => () => { /* do nothing */ };
const defaultDialogue:Dialogue = {
  text: '',
};
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

function cleanup(mesh: Mesh) {
  mesh.geometry.dispose();
  if (Array.isArray(mesh.material)) {
    mesh.material.forEach((material) => material.dispose());
  } else {
    mesh.material.dispose();
  }
  if (mesh.parent) {
    mesh.parent.remove(mesh);
  }
}

// units are meters let's say
const depth = 0.1;
const cubeUnit = 3;

const Game: FC = () => {
  const [advanceAction, setAdvanceAction] = useState<() => void>(defaultAction);
  const [useTopic, setUseTopic] = useState<() => void>(defaultAction);
  const [useItem, setUseItem] = useState<() => void>(defaultAction);
  const [isTalking, setIsTalking] = useState(false);
  const endDialogue = useRef(false);

  const { loading, /* error, */ data } = useQuery(GAME_STATE);

  if (loading || !data) {
    return null;
  }

  let location:Location = defaultLocation;
  let dialogue:Dialogue = defaultDialogue;
  let dialogueThemeId = '';
  const {
    dialogueId, focusId, locationId, time, topics, items,
  } = data;

  if (locationId && Locations[locationId]) {
    location = Locations[locationId];
  }
  if (dialogueId) {
    const keys = dialogueId.split('/');
    if (Dialogues[keys[0]] && Dialogues[keys[0]][keys[1]]) {
      dialogue = Dialogues[keys[0]][keys[1]];
      [dialogueThemeId] = keys;
    } else {
      dialogueThemeId = '';
    }
  }
  // initializable -- no need to update
  const scene = useRef(new Scene());
  const cameraDefaultPosition = useRef(new Vector3());
  const camera = useRef(new PerspectiveCamera());
  const dummyCamera = useRef(new Camera());
  const entities = useRef<Object3D[]>([]);
  const clickables = useRef<Record<string, Object3D>>({});
  const cleanupList = useRef<Mesh[]>([]);
  // eslint-disable-next-line comma-spacing
  const activates = useRef<Record<string,() => void>>({});
  const ambientLight = useRef(new AmbientLight(0xffffff, 0));
  const hemisphereLight = useRef(new HemisphereLight(0xffffff, 0xffffff, 0));
  const directionalLight = useRef(new DirectionalLight(0xffffff, 0));
  const backgroundRenderTarget = useRef(new WebGLCubeRenderTarget(0));
  const animationFrameId = useRef(0);

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

  const { width, height } = useWindowSize();

  // write lookup table
  useEffect(() => {
    async function makeLookupTables() {
      setLookupTables({
        nightfromday: await makeLookupTable('/assets/nightfromday.CUBE'),
        LateSunset: await makeLookupTable('/assets/LateSunset.3DL'),
      });
    }
    makeLookupTables();
  }, []);

  // initialization
  useEffect(() => {
    // console.log(scene.current.children);
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

  useEffect(() => {
    if (locationId && Object.keys(lookupTables).length) {
      loadLocation(
        scene.current,
        location,
        cameraDefaultPosition.current,
        camera.current,
        directionalLight.current,
        entities.current,
        clickables.current,
        activates.current,
        cleanupList.current,
        ambientLight.current,
        hemisphereLight.current,
        cubeUnit,
        depth,
        lookupTables,
        filteredBackgrounds,
        setFilteredBackgrounds,
      );
    }

    return () => {
      while (cleanupList.current.length) {
        const next = cleanupList.current.shift();
        if (next) {
          cleanup(next);
        }
      }
      entities.current = [];
      clickables.current = {};
      activates.current = {};
    };
  }, [locationId, Object.keys(lookupTables).length]);

  // handle time lighting
  useEffect(() => {
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
  useEffect(() => {
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

  // handle dialogue box
  useEffect(() => {
    if (dialogueId) {
      if (dialogue.effect) {
        dialogue.effect();
      }
    } else {
      setAdvanceAction(defaultAction);
    }
  }, [dialogueId]);
  useMousePositionEffect((mouseX, mouseY) => {
    if (dialogueId && dialogue) {
      if (isTalking) {
        setAdvanceAction(() => () => {
          endDialogue.current = true;
        });
      } else if (typeof dialogue.next === 'string') {
        if (dialogue.next === '') {
          setAdvanceAction(() => () => {
            if (height && width && mouseX && mouseY) {
              dummyCamera.current.setRotationFromEuler(new Euler(
                -Math.PI * (mouseY / height - 0.5) * 0.05,
                -Math.PI * (mouseX / width - 0.5) * (height / width),
                0,
                'YXZ',
              ));
            }
            unfocus();
          });
        } else {
          setAdvanceAction(() => () => {
            setDialogue(dialogue.next || '');
          });
        }
      }
      setUseTopic(() => (topicId:string) => {
        if (dialogue.topic && dialogue.topic[topicId]) {
          dialogue.topic[topicId]();
        }
      });
      setUseItem(() => (itemId:string) => {
        if (dialogue.item && dialogue.item[itemId]) {
          dialogue.item[itemId]();
        }
      });
    }
  }, [dialogueId, isTalking]);

  // set canvas width and height
  useEffect(() => {
    camera.current.aspect = window.innerWidth / window.innerHeight;
    camera.current.updateProjectionMatrix();
    if (renderer) {
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
  }, [width, height]);

  // mouse move event
  useMousePositionEffect((mouseX, mouseY) => {
    const raycaster = new Raycaster();
    if (height && width && mouseX && mouseY) {
      if (!focusId) {
        dummyCamera.current.setRotationFromEuler(new Euler(
          -Math.PI * (mouseY / height - 0.5) * 0.05,
          -Math.PI * (mouseX / width - 0.5) * (height / width),
          0,
          'YXZ',
        ));
      }
      raycaster.setFromCamera(
        new Vector2(
          (mouseX / width) * 2 - 1,
          (mouseY / height) * -2 + 1,
        ),
        camera.current,
      );
      const intersects = raycaster.intersectObjects(Object.values(clickables.current));
      if (renderer) {
        if (intersects.length) {
          renderer.domElement.style.cursor = 'pointer';
        } else {
          renderer.domElement.style.cursor = 'default';
        }
      }
    }
  }, [width, height, focusId]);

  // mouse click event
  useEffect(() => {
    const raycaster = new Raycaster();
    function click(event:MouseEvent) {
      if (width && height) {
        raycaster.setFromCamera(
          new Vector2(
            (event.clientX / width) * 2 - 1,
            (event.clientY / height) * -2 + 1,
          ),
          camera.current,
        );
        const intersects = raycaster.intersectObjects(Object.values(clickables.current));
        if (intersects.length) {
          if (focusId) {
            advanceAction();
          } else {
            setFocus(intersects[0].object.name);
            activates.current[intersects[0].object.name]();
          }
        }
      }
    }
    if (renderer) {
      renderer.domElement.addEventListener('click', click);
    }
    return () => {
      if (renderer) {
        renderer.domElement.removeEventListener('click', click);
      }
    };
  }, [width, height, focusId, advanceAction]);

  useEffect(() => {
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

  // animation loop
  useEffect(() => {
    function animate() {
      if (renderer) {
        entities.current.forEach((entity) => {
          entity.lookAt(
            camera.current.position.x,
            entity.position.y, // keep parallel with ground
            camera.current.position.z,
          );
        });
        if (focusId) {
          const focusPosition = clickables.current[focusId].position.clone();
          focusPosition.add(new Vector3(0, 0.2, 0)); // focus on face
          dummyCamera.current.lookAt(focusPosition);
          // math
          const destination = cameraDefaultPosition.current.clone()
            .sub(focusPosition)
            .normalize()
            .multiplyScalar(2)
            .add(focusPosition);
          dummyCamera.current.position.copy(destination);
        } else {
          dummyCamera.current.position.copy(cameraDefaultPosition.current);
        }
        camera.current.quaternion.slerp(dummyCamera.current.quaternion, 0.05);
        camera.current.position.lerp(dummyCamera.current.position, 0.05);
        renderer.render(scene.current, camera.current);
      }
      animationFrameId.current = requestAnimationFrame(animate);
    }
    animationFrameId.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId.current);
  }, [height, width, focusId]);

  return (
    <GameArea ref={target}>
      <div />
      <GameGrid>
        <DialogueBox
          dialogue={dialogue}
          theme={dialogueThemeId}
          advance={advanceAction}
          isTalking={isTalking}
          setIsTalking={setIsTalking}
          endDialogue={endDialogue}
        />
        <TopicsDrawer
          topics={topics}
          focus={focusId}
          useTopic={useTopic}
        />
        <ItemsDrawer
          items={items}
          focus={focusId}
          useItem={useItem}
        />
      </GameGrid>
    </GameArea>
  );
};

export default Game;
