import {
  Dispatch, MutableRefObject, SetStateAction, useEffect, useRef,
} from 'react';
import {
  Camera, Color, DirectionalLight, Euler, Material, Raycaster, Renderer, Scene, Vector2, Vector3,
} from 'three';
import { GameEntity } from '../utils/interfaces';
import { setFocus, focusId } from '../data/state';
import { getAction } from '../utils/getters';
import { transitionOpacity } from './transitions';

const useAnimationLoop = (
  renderer: Renderer | undefined,
  scene: Scene,
  camera: Camera,
  dummyCamera: Camera,
  directionalLight: DirectionalLight,
  directionalLightTarget: { position: Vector3; color: Color; },
  gameEntities: Record<string, GameEntity> | undefined,
  transitionQueue: MutableRefObject<{
    type: string;
    value: number;
    material?: Material | undefined;
  }[]>,
  advanceAction: () => void,
  setFps: Dispatch<SetStateAction<number>> | null,
): void => {
  const raycaster = useRef(new Raycaster());
  const prevTimestamp = useRef(0);
  const mouseX = useRef(0);
  const mouseY = useRef(0);
  const animationFrameId = useRef(0);
  const activate = useRef(() => { /* do nothing */ });

  function click() {
    activate.current();
  }

  function handleMove(event:MouseEvent) {
    mouseX.current = event.clientX;
    mouseY.current = event.clientY;
  }
  useEffect(() => { // animation loop
    const prevPosition = new Vector3();
    if (!mouseX.current || !mouseY.current) {
      mouseX.current = window.innerWidth / 2;
      mouseY.current = window.innerHeight / 2;
    }
    function animate(timestamp: number) {
      if (renderer) {
        const delta = timestamp - prevTimestamp.current;
        if (delta && setFps) {
          setFps(Math.round(1000 / delta));
        }
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
            Math.abs(camera.position.x - prevPosition.x) > 0.001
            || Math.abs(camera.position.y - prevPosition.y) > 0.001
            || Math.abs(camera.position.z - prevPosition.z) > 0.001
          ) {
            Object.values(gameEntities).forEach((entity) => {
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
          raycaster.current.setFromCamera(
            new Vector2(
              (mouseX.current / window.innerWidth) * 2 - 1,
              (mouseY.current / window.innerHeight) * -2 + 1,
            ),
            camera,
          );
          const intersection = raycaster.current.intersectObjects(
            Object.values(gameEntities)
              .filter((gameEntity) => gameEntity.activate
                && (!gameEntity.getVisibility || gameEntity.getVisibility()))
              .map((gameEntity) => gameEntity.mesh),
          )[0];
          if (intersection) {
            // with browser dev tools open doesn't seem to work, but value
            // is actually changed. Probably the check is off with it open?
            // eslint-disable-next-line no-param-reassign
            renderer.domElement.style.cursor = 'pointer';
            if (focusId()) {
              activate.current = advanceAction;
            } else {
              activate.current = () => {
                setFocus(intersection.object.name);
                getAction(gameEntities[intersection.object.name].activate)();
              };
            }
          } else {
            // eslint-disable-next-line no-param-reassign
            renderer.domElement.style.cursor = 'default';
            activate.current = () => { /* do nothing */ };
          }
        }
        if (!focusId()) { // only rotate camera if not focused
          dummyCamera.setRotationFromEuler(new Euler(
            -Math.PI * (mouseY.current / window.innerHeight - 0.5) * 0.05,
            -Math.PI
            * (mouseX.current / window.innerWidth - 0.5)
            * (window.innerHeight / window.innerWidth),
            0,
            'YXZ',
          ));
        }
        // const test = scene.getObjectByProperty('type', 'DirectionalLight');
        // if (test?.shadow.camera) {
        //   renderer.render(scene, test?.shadow.camera);
        // } else {
        renderer.render(scene, camera);
        // }
        prevPosition.copy(camera.position);
      }
      prevTimestamp.current = timestamp;
      animationFrameId.current = requestAnimationFrame(animate);
    }
    if (renderer) {
      animationFrameId.current = requestAnimationFrame(animate);
      window.addEventListener('mousemove', handleMove);
      renderer.domElement.addEventListener('click', click);
      return () => {
        cancelAnimationFrame(animationFrameId.current);
        window.removeEventListener('mousemove', handleMove);
        renderer.domElement.removeEventListener('click', click);
      };
    }
    return () => { /* do nothing */ };
  }, [renderer, gameEntities, advanceAction, setFps]);
};

export default useAnimationLoop;
