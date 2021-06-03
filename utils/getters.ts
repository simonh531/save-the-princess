import { setDialogue } from '../data/state';

export const getText = (text:string | (() => string)):string => {
  if (typeof text === 'string') {
    return text;
  }
  return text();
};

export const getAction = (action:string | (() => void)):() => void => {
  if (typeof action === 'string') {
    return () => setDialogue(action);
  }
  return action;
};
