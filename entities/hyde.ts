import { setDialogue } from '../data/state';

export default {
  file: '/assets/hyde/hyde.jpg',
  geometry: '/assets/hyde/hyde.svg',
  height: 1.7,
  cameraAdjustment: [0, 0.3, 0],
  activate: ():void => {
    setDialogue('hyde/intro');
  },
};
