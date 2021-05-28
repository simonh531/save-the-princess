import {
  FC, useState, useEffect, useRef,
} from 'react';
import styled from 'styled-components';
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  TextureLoader,
  WebGLCubeRenderTarget,
  Raycaster,
  Vector2,
  Euler,
  Camera,
  Vector3,
} from 'three';
import { useQuery, gql } from '@apollo/client';

import { setFocus, setDialogue, unfocus } from '../../data/state';
import { useWindowSize, useMousePosition } from '../../utils/hooks';
import { ActivateList, Dialogue, WorldObjects } from '../../utils/interfaces';
import {
  loadCeiling, loadFloor, loadWalls, loadEntities,
} from '../../utils/loaders';
import locations from '../../locations';

import GameGrid from '../../components/gameGrid';
import DialogueBox from '../../components/dialogueBox';
import TopicsDrawer from '../../components/topicsDrawer';
import ItemsDrawer from '../../components/itemsDrawer';
import dialogueList from '../../dialogue';

const GAME_STATE = gql`
  query GetGameState {
    dialogue,
    focus,
    location,
    topics,
    items,
  }
`;

const GameArea = styled.main`
  height: 100vh;
  width: 100vw;
  overflow:hidden;
`;

const defaultAction = () => () => { /* do nothing */ };
const defaultDialogue = {
  text: '',
};

const Game: FC = () => {
  const [advanceAction, setAdvanceAction] = useState<() => void>(defaultAction);
  const [currentDialogue, setCurrentDialogue] = useState<Dialogue>(defaultDialogue);
  const [dialogueTheme, setDialogueTheme] = useState<string>('');
  const [useTopic, setUseTopic] = useState<() => void>(defaultAction);
  const [useItem, setUseItem] = useState<() => void>(defaultAction);
  const [isTalking, setIsTalking] = useState(false);
  const [endDialogue, setEndDialogue] = useState(false);

  const { loading, /* error, */ data } = useQuery(GAME_STATE);
  const {
    location, focus, dialogue, topics, items,
  } = data;

  const scene = useRef(new Scene());
  const cameraPosition = useRef(new Vector3());
  const camera = useRef(new PerspectiveCamera());
  const dummyCamera = useRef(new Camera());
  const worldObjects = useRef<WorldObjects>({});
  const entities = useRef<WorldObjects>({});
  const clickables = useRef<WorldObjects>({});
  const activates = useRef<ActivateList>({});
  const renderer = useRef<WebGLRenderer|null>(null);

  const target = useRef<HTMLDivElement|null>(null);

  const { width, height } = useWindowSize();
  const { mouseX, mouseY } = useMousePosition();

  // initialization
  useEffect(() => {
    renderer.current = new WebGLRenderer();
  }, []);

  // load data
  useEffect(() => {
    if (loading === false && data && locations[location]) {
      const currentLocation = locations[location];
      const loader = new TextureLoader();
      const texture = loader.load(
        currentLocation.background,
        () => {
          const rt = new WebGLCubeRenderTarget(texture.image.height);
          if (renderer.current instanceof WebGLRenderer) {
            rt.fromEquirectangularTexture(renderer.current, texture);
          }
          scene.current.background = rt.texture;
        },
      );
      loadWalls(
        loader, scene.current, worldObjects.current,
        currentLocation.walls, currentLocation.wallPlan, cameraPosition.current, camera.current,
      );
      loadFloor(
        loader, scene.current, worldObjects.current,
        currentLocation.floor, currentLocation.floorPlan,
      );
      loadCeiling(
        loader, scene.current, worldObjects.current,
        currentLocation.ceiling, currentLocation.ceilingPlan,
      );
      loadEntities(
        loader, scene.current,
        entities.current, clickables.current, activates.current,
        currentLocation.entities,
      );
      if (target.current && renderer.current) {
        target.current.replaceChild(renderer.current.domElement, target.current.childNodes[0]);
      }
    }
  }, [loading]);

  // handle dialogue box
  useEffect(() => {
    const keys = dialogue.split('/');
    if (dialogueList[keys[0]] && dialogueList[keys[0]][keys[1]]) {
      const newDialogue = dialogueList[keys[0]][keys[1]];
      setCurrentDialogue(newDialogue);
      setDialogueTheme(keys[0]);
      if (newDialogue.effect) {
        newDialogue.effect();
      }
    } else {
      setCurrentDialogue(defaultDialogue);
      setAdvanceAction(defaultAction);
      setDialogueTheme('');
    }
  }, [dialogue]);
  useEffect(() => {
    if (currentDialogue.text) {
      if (isTalking) {
        setAdvanceAction(() => () => setEndDialogue(true));
      } else if (typeof currentDialogue.next === 'string') {
        if (currentDialogue.next === '') {
          setAdvanceAction(() => () => {
            setEndDialogue(false);
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
        } else if (currentDialogue.next) {
          setAdvanceAction(() => () => {
            setEndDialogue(false);
            setDialogue(currentDialogue.next || '');
          });
        }
      }
      setUseTopic(() => (topicId:string) => {
        if (currentDialogue.topic && currentDialogue.topic[topicId]) {
          currentDialogue.topic[topicId]();
        }
      });
      setUseItem(() => (itemId:string) => {
        if (currentDialogue.item && currentDialogue.item[itemId]) {
          currentDialogue.item[itemId]();
        }
      });
    }
  }, [currentDialogue, isTalking]);

  // set canvas width and height
  useEffect(() => {
    camera.current.aspect = window.innerWidth / window.innerHeight;
    camera.current.updateProjectionMatrix();
    if (renderer.current) {
      renderer.current.setSize(window.innerWidth, window.innerHeight);
    }
  }, [width, height]);

  // mouse move event
  useEffect(() => {
    const raycaster = new Raycaster();
    if (height && width && mouseX && mouseY) {
      if (!focus) {
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
      if (renderer.current) {
        if (intersects.length) {
          renderer.current.domElement.style.cursor = 'pointer';
        } else {
          renderer.current.domElement.style.cursor = 'default';
        }
      }
    }
  }, [width, height, mouseX, mouseY, focus]);

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
          if (focus) {
            advanceAction();
          } else {
            setFocus(intersects[0].object.name);
            activates.current[intersects[0].object.name]();
          }
        }
      }
    }
    if (renderer.current) {
      renderer.current.domElement.addEventListener('click', click);
    }
    return () => {
      if (renderer.current) {
        renderer.current.domElement.removeEventListener('click', click);
      }
    };
  }, [width, height, focus, advanceAction]);

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
    let id:number;
    function animate() {
      if (renderer.current) {
        Object.values(entities.current).forEach((entity) => {
          entity.lookAt(
            camera.current.position.x,
            entity.position.y,
            camera.current.position.z,
          );
        });
        if (focus) {
          const focusPosition = clickables.current[focus].position.clone();
          focusPosition.add(new Vector3(0, 0.1, 0));
          dummyCamera.current.lookAt(focusPosition);
          // math
          const destination = cameraPosition.current.clone();
          destination.sub(focusPosition);
          destination.normalize().multiplyScalar(0.6);
          destination.add(focusPosition);
          dummyCamera.current.position.copy(destination);
        } else {
          dummyCamera.current.position.copy(cameraPosition.current);
        }
        camera.current.quaternion.slerp(dummyCamera.current.quaternion, 0.05);
        camera.current.position.lerp(dummyCamera.current.position, 0.05);
        renderer.current.render(scene.current, camera.current);
      }
      id = requestAnimationFrame(animate);
    }
    id = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(id);
  }, [height, width, focus]);

  return (
    <GameArea ref={target}>
      <div />
      <GameGrid>
        <DialogueBox
          dialogue={currentDialogue}
          theme={dialogueTheme}
          advance={advanceAction}
          setIsTalking={setIsTalking}
          endDialogue={endDialogue}
        />
        <TopicsDrawer
          topics={topics}
          focus={focus}
          useTopic={useTopic}
        />
        <ItemsDrawer
          items={items}
          focus={focus}
          useItem={useItem}
        />
      </GameGrid>
    </GameArea>
  );
};

export default Game;
