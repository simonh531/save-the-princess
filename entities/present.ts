import { setDialogue } from '../data/state';

export default {
  file: '/assets/present/Present.png',
  geometry: '/assets/present/present.svg',
  height: 1,
  activate: ():void => {
    setDialogue('present/pickup');
  },
};
