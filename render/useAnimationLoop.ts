import {
  MutableRefObject, useEffect, useRef, useState,
} from 'react';
import { gql, useQuery } from '@apollo/client';
import {
  Camera, Color, DirectionalLight, Euler, Material, Raycaster, Renderer, Scene, Vector2, Vector3,
} from 'three';
import { GameEntity } from '../utils/interfaces';
import { getAction } from '../utils/getters';
import { transitionOpacity } from './transitions';

const FOCUS = gql`
  query GetFocus {
    focusId,
  }
`;

const useAnimationLoop = (
  renderer: Renderer | undefined,
  scene: Scene,
  camera: Camera,
  dummyCamera: Camera,
  directionalLight: DirectionalLight,
  directionalLightTarget: { position: Vector3; color: Color; },
  gameEntities: GameEntity[],
  transitionQueue: MutableRefObject<{
    type: string;
    value: number;
    material?: Material | undefined;
  }[]>,
  advanceAction: () => void,
  showFps: boolean,
  cameraDefaultPosition: Vector3 | undefined,
  focusPositions: Record<string, Vector3> | undefined,
): number => {
  const { data } = useQuery(FOCUS);
  const { focusId } = data;
  const raycaster = useRef(new Raycaster());
  const prevTimestamp = useRef(0);
  const mouseX = useRef(0);
  const mouseY = useRef(0);
  const activate = useRef(() => { /* do nothing */ });
  const [fps, setFps] = useState(0);
  const [cameraStopped, setCameraStopped] = useState(false);
  const cameraStoppedRef = useRef(cameraStopped);

  const advanceActionRef = useRef(advanceAction);
  const focusIdRef = useRef(focusId);
  const showFpsRef = useRef(showFps);

  function click() {
    activate.current();
  }

  function handleMove(event:MouseEvent) {
    mouseX.current = event.clientX;
    mouseY.current = event.clientY;
  }

  useEffect(() => { // put everything in refs so animation loop doesn't update often
    advanceActionRef.current = advanceAction;
    focusIdRef.current = focusId;
    showFpsRef.current = showFps;
    cameraStoppedRef.current = cameraStopped;
  }, [advanceAction, focusId, showFps, cameraStopped]);

  useEffect(() => { // animation loop
    let animationFrameId: number;
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
    function animate(timestamp: number) {
      if (renderer) {
        const delta = timestamp - prevTimestamp.current;
        camera.quaternion.slerp(dummyCamera.quaternion, Math.min(delta * 0.003125, 1));
        camera.position.lerp(dummyCamera.position, Math.min(delta * 0.003125, 1));
        directionalLight.position.lerp(
          directionalLightTarget.position, Math.min(delta * 0.0002, 1),
        );
        directionalLight.color.lerp(
          directionalLightTarget.color, Math.min(delta * 0.0002, 1),
        );
        if (gameEntities) {
          if ( // only change where entities are facing if moving
            Math.abs(camera.position.x - prevPositionX) > 0.001
            || Math.abs(camera.position.y - prevPositionY) > 0.001
            || Math.abs(camera.position.z - prevPositionZ) > 0.001
          ) {
            gameEntities.forEach((entity) => {
              entity.mesh.lookAt(
                camera.position.x,
                entity.mesh.position.y, // keep parallel with ground
                camera.position.z,
              );
            });
          }

          if (transitionQueue.current.length) {
            // eslint-disable-next-line no-param-reassign
            transitionQueue.current = transitionQueue.current.filter((transition) => {
              if (transition.type === 'opacity' && transition.material) {
                return transitionOpacity(transition.material, transition.value, delta);
              }
              return false;
            });
          }

          // handle pointer
          if (
            mouseX.current !== prevMouseX
            || mouseY.current !== prevMouseY
            || Math.abs(camera.rotation.x - prevCameraX) > 0.00001
            || Math.abs(camera.rotation.y - prevCameraY) > 0.00001
          ) {
            raycaster.current.setFromCamera(
              new Vector2(
                (mouseX.current / window.innerWidth) * 2 - 1,
                (mouseY.current / window.innerHeight) * -2 + 1,
              ),
              camera,
            );
            const intersection = raycaster.current.intersectObjects(
              gameEntities
                .filter((gameEntity) => gameEntity.activate
                  && (!gameEntity.getVisibility || gameEntity.getVisibility()))
                .map((gameEntity) => gameEntity.mesh),
            )[0];
            if (intersection) {
              // with browser dev tools open doesn't seem to work, but value
              // is actually changed. Probably the check is off with it open?
              // eslint-disable-next-line no-param-reassign
              renderer.domElement.style.cursor = 'pointer';
              if (focusIdRef.current) {
                activate.current = advanceActionRef.current;
              } else {
                const action = gameEntities[
                  intersection.object.userData.index
                ].activate;
                if (action) {
                  activate.current = getAction(action);
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
          dummyCamera.setRotationFromEuler(new Euler(
            -Math.PI * (mouseY.current / window.innerHeight - 0.5) * 0.05,
            -Math.PI
            * (mouseX.current / window.innerWidth - 0.5)
            * (window.innerHeight / window.innerWidth),
            0,
            'YXZ',
          ));
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
          setFps(Math.round(1000 / delta));
        }
      }
      prevTimestamp.current = timestamp;
      animationFrameId = requestAnimationFrame(animate);
    }
    if (renderer) {
      animationFrameId = requestAnimationFrame(animate);
      window.addEventListener('mousemove', handleMove);
      renderer.domElement.addEventListener('click', click);
      return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('mousemove', handleMove);
        renderer.domElement.removeEventListener('click', click);
      };
    }
    return () => { /* do nothing */ };
  }, [
    renderer, gameEntities, camera, dummyCamera,
    directionalLight, directionalLightTarget, scene, transitionQueue,
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
