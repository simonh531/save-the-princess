import { setDialogue, setFocus } from '../data/state';
import { activateable } from './interfaces';

export const getText = (text:string | (() => string)):string => {
  if (typeof text === 'string') {
    return text;
  }
  return text();
};

export const getAction = (action: activateable):() => void => {
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
