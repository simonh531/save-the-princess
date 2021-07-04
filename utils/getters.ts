import { AnimationMixer, Object3D } from 'three';
import { setDialogue, setFocus } from '../data/state';
import { Activatable, GameEntity } from './interfaces';

export const getText = (text:string | (() => string)):string => {
  if (typeof text === 'string') {
    return text;
  }
  return text();
};

export const getAction = (action: Activatable):() => void => {
  switch (typeof action) {
    case 'string':
      return () => setDialogue(action);
    case 'object':
      return () => {
        setFocus(action.focusId);
        setDialogue(action.dialogueId);
      };
    case 'function':
      return action;
    default:
      return () => { /* do nothing */ };
  }
};

export const getActiveMesh = (gameEntity: GameEntity):Object3D => {
  const { group, altId } = gameEntity;
  const alt = group.getObjectByName(altId);
  if (alt) {
    return alt;
  }
  const defaultMesh = group.getObjectByName('default');
  if (defaultMesh) {
    return defaultMesh;
  }
  return group.children[0];
};

export const getActiveMixer = (gameEntity: GameEntity):AnimationMixer => {
  const { mixers, altId } = gameEntity;
  if (mixers[altId]) {
    return mixers[altId];
  }
  return mixers.default;
};
