import {
  MutableRefObject, useEffect, useRef, useState,
} from 'react';
import { gql, useQuery } from '@apollo/client';
import {
  AmbientLight, Clock,
  Camera, Color, DirectionalLight, Euler,
  PerspectiveCamera, Raycaster, Scene, Vector2, Vector3, WebGLRenderer, AnimationMixer,
} from 'three';
import { GameEntity } from '../utils/interfaces';
import { getAction } from '../utils/getters';

const FOCUS = gql`
  query GetFocus {
    focusId,
  }
`;

const useAnimationLoop = (
  gameArea: HTMLDivElement | null,
  renderer: WebGLRenderer | undefined,
  scene: Scene,
  camera: PerspectiveCamera,
  dummyCamera: Camera,
  directionalLight: DirectionalLight,
  directionalLightTarget: { position: Vector3; color: Color; },
  ambientLight: AmbientLight,
  gameEntities:Map<string, GameEntity>,
  mixerQueue: AnimationMixer[],
  advanceAction: () => void,
  showFps: boolean,
  cameraDefaultPosition: Vector3 | undefined,
  focusPositions: Record<string, Vector3> | undefined,
): number => {
  const { data } = useQuery(FOCUS);
  const { focusId } = data;
  const mouseX = useRef(0);
  const mouseY = useRef(0);
  const activate = useRef<(() => void) | MutableRefObject<() => void>>(() => { /* do nothing */ });
  const [fps, setFps] = useState(0);
  const [cameraStopped, setCameraStopped] = useState(false);
  const cameraStoppedRef = useRef(cameraStopped);

  const advanceActionRef = useRef(advanceAction);
  const focusIdRef = useRef(focusId);
  const showFpsRef = useRef(showFps);
  const gameEntitiesRef = useRef(gameEntities);

  function click() {
    if ('current' in activate.current) {
      activate.current.current();
    } else {
      activate.current();
    }
  }

  function handleMove(event:MouseEvent) {
    mouseX.current = event.clientX;
    mouseY.current = event.clientY;
  }

  useEffect(() => { // put everything in refs so animation loop doesn't update
    advanceActionRef.current = advanceAction;
  }, [advanceAction]);
  useEffect(() => {
    focusIdRef.current = focusId;
  }, [focusId]);
  useEffect(() => {
    showFpsRef.current = showFps;
  }, [showFps]);
  useEffect(() => {
    cameraStoppedRef.current = cameraStopped;
  }, [cameraStopped]);
  useEffect(() => {
    gameEntitiesRef.current = gameEntities;
  }, [gameEntities]);

  useEffect(() => { // animation loop
    const euler = new Euler(0, 0, 0, 'YXZ');
    const vector = new Vector3();
    const clock = new Clock();
    const raycaster = new Raycaster();
    raycaster.layers.set(1);
    let prevPositionX = 0;
    let prevPositionY = 0;
    let prevPositionZ = 0;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let prevCameraX = 0;
    let prevCameraY = 0;
    if (!mouseX.current || !mouseY.current) {
      mouseX.current = window.innerWidth / 2;
      mouseY.current = window.innerHeight / 2;
    }
    function animate() {
      if (renderer) {
        const delta = clock.getDelta();
        camera.quaternion.slerp(dummyCamera.quaternion, Math.min(delta * 3.125, 1));
        camera.position.lerp(dummyCamera.position, Math.min(delta * 3.125, 1));
        directionalLight.position.lerp(
          directionalLightTarget.position, Math.min(delta * 0.2, 1),
        );
        directionalLight.color.lerp(
          directionalLightTarget.color, Math.min(delta * 0.2, 1),
        );
        ambientLight.color.copy(directionalLight.color);
        if (gameEntitiesRef.current.size) {
          if ( // only change where entities are facing if moving
            Math.abs(camera.position.x - prevPositionX) > 0.001
            || Math.abs(camera.position.y - prevPositionY) > 0.001
            || Math.abs(camera.position.z - prevPositionZ) > 0.001
          ) {
            gameEntitiesRef.current.forEach((entity) => {
              entity.group.lookAt(
                camera.position.x,
                entity.group.position.y, // keep parallel with ground
                camera.position.z,
              );
            });
          }

          if (mixerQueue.length) {
            mixerQueue.forEach((mixer) => {
              mixer.update(delta);
            });
          }

          // handle pointer
          if (
            mouseX.current !== prevMouseX
            || mouseY.current !== prevMouseY
            || Math.abs(camera.rotation.x - prevCameraX) > 0.00001
            || Math.abs(camera.rotation.y - prevCameraY) > 0.00001
          ) {
            raycaster.setFromCamera(
              new Vector2(
                (mouseX.current / window.innerWidth) * 2 - 1,
                (mouseY.current / window.innerHeight) * -2 + 1,
              ),
              camera,
            );
            const intersection = raycaster.intersectObjects(scene.children, true)[0];
            if (intersection) {
              // with browser dev tools open doesn't seem to work, but value
              // is actually changed. Probably the check is off with it open?
              // eslint-disable-next-line no-param-reassign
              renderer.domElement.style.cursor = 'pointer';
              if (focusIdRef.current) {
                activate.current = advanceActionRef;
              } else if (intersection.object.parent && gameEntitiesRef.current.size) {
                const gameEntity = gameEntitiesRef.current.get(intersection.object.parent.name);
                if (gameEntity && gameEntity.activate) {
                  activate.current = getAction(gameEntity.activate);
                }
              }
            } else {
              // eslint-disable-next-line no-param-reassign
              renderer.domElement.style.cursor = 'default';
              activate.current = () => { /* do nothing */ };
            }
          }
        }
        if (!focusIdRef.current) { // only rotate camera if not focused
          const { cameraVerticalRange, cameraHorizontalRange, cameraAngle } = dummyCamera.userData;
          let x = 0;
          let y = 0;
          if (cameraVerticalRange) {
            x = -2 * (mouseY.current / window.innerHeight - 0.5)
              * (cameraVerticalRange - camera.fov * (Math.PI / 360));
          }
          if (cameraHorizontalRange) {
            y = -2 * (mouseX.current / window.innerWidth - 0.5) * (cameraHorizontalRange
              - Math.atan(camera.aspect * Math.tan(camera.fov * (Math.PI / 360))) // calculate h fov
            );
          }
          vector.set(x, y, 0);
          if (cameraAngle) {
            vector.add(cameraAngle);
          }
          dummyCamera.setRotationFromEuler(euler.setFromVector3(vector));
          if (cameraStoppedRef.current) {
            setCameraStopped(false);
          }
        } else if (!cameraStoppedRef.current) {
          setCameraStopped(true);
        }
        // const test = scene.getObjectByProperty('type', 'DirectionalLight');
        // if (test?.shadow.camera) {
        //   renderer.render(scene, test?.shadow.camera);
        // } else {
        renderer.render(scene, camera);
        // }
        [prevPositionX, prevPositionY, prevPositionZ] = camera.position.toArray();
        [prevCameraX, prevCameraY] = camera.rotation.toArray();
        prevMouseX = mouseX.current;
        prevMouseY = mouseY.current;
        if (showFpsRef.current && delta) {
          setFps(Math.round(1 / delta));
        }
      }
    }
    if (renderer && gameArea) {
      renderer.setAnimationLoop(animate);
      gameArea.addEventListener('mousemove', handleMove);
      renderer.domElement.addEventListener('click', click);
      return () => {
        renderer.setAnimationLoop(null);
        gameArea.removeEventListener('mousemove', handleMove);
        renderer.domElement.removeEventListener('click', click);
      };
    }
    return () => { /* do nothing */ };
  }, [
    renderer, camera, dummyCamera, directionalLight, directionalLightTarget,
    gameArea, ambientLight.color, scene, mixerQueue,
  ]);

  useEffect(() => { // handle camera movement on focus change
    if (cameraDefaultPosition && focusPositions && cameraStopped) {
      if (focusId && focusPositions[focusId]) {
        // math
        const destination = cameraDefaultPosition.clone()
          .sub(focusPositions[focusId])
          .normalize()
          .multiplyScalar(2)
          .add(focusPositions[focusId]);
        dummyCamera.position.copy(destination);
        dummyCamera.lookAt(focusPositions[focusId]);
      } else {
        dummyCamera.position.copy(cameraDefaultPosition);
      }
    }
  }, [focusId, cameraDefaultPosition, focusPositions, dummyCamera, cameraStopped]);

  return fps;
};

export default useAnimationLoop;
