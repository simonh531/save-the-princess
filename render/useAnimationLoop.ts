import { useEffect, useRef } from 'react';
import {
  Camera, Euler, Raycaster, Renderer, Scene, Vector2, Vector3,
} from 'three';
import { GameEntity } from '../utils/interfaces';
import { setFocus, focusId } from '../data/state';
import { getAction } from '../utils/getters';

const useAnimationLoop = (
  renderer: Renderer | undefined,
  scene: Scene,
  camera: Camera,
  dummyCamera: Camera,
  gameEntities: Record<string, GameEntity>,
  advanceAction: () => void,
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
        camera.quaternion.slerp(dummyCamera.quaternion, Math.min(delta * 0.003125, 1));
        camera.position.lerp(dummyCamera.position, Math.min(delta * 0.003125, 1));
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
        const { innerHeight, innerWidth } = window;
        if (!focusId()) { // only rotate camera if not focused
          dummyCamera.setRotationFromEuler(new Euler(
            -Math.PI * (mouseY.current / innerHeight - 0.5) * 0.05,
            -Math.PI * (mouseX.current / innerWidth - 0.5) * (innerHeight / innerWidth),
            0,
            'YXZ',
          ));
        }
        // handle pointer
        raycaster.current.setFromCamera(
          new Vector2(
            (mouseX.current / innerWidth) * 2 - 1,
            (mouseY.current / innerHeight) * -2 + 1,
          ),
          camera,
        );
        const intersects = raycaster.current.intersectObjects(
          Object.values(gameEntities)
            .filter((gameEntity) => gameEntity.activate && gameEntity.mesh.visible)
            .map((gameEntity) => gameEntity.mesh),
        );
        if (intersects.length) {
          // with browser dev tools open doesn't seem to work, but value
          // is actually changed. Probably the check is off with it open?
          // eslint-disable-next-line no-param-reassign
          renderer.domElement.style.cursor = 'pointer';
          if (focusId()) {
            activate.current = advanceAction;
          } else {
            activate.current = () => {
              setFocus(intersects[0].object.name);
              getAction(gameEntities[intersects[0].object.name].activate)();
            };
          }
        } else {
          // eslint-disable-next-line no-param-reassign
          renderer.domElement.style.cursor = 'default';
          activate.current = () => { /* do nothing */ };
        }
        renderer.render(scene, camera);
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
  }, [renderer, gameEntities, advanceAction]);
};

export default useAnimationLoop;
