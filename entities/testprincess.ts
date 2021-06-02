import { focusId, setDialogue } from '../data/state';

export default {
  file: '/assets/testprincess/testprincess.png',
  geometry: '/assets/testprincess/testprincess.svg',
  height: 1.7,
  cameraAdjustment: [0, 0.3, 0],
  activate: ():void => {
    switch (focusId()) {
      case 'princess1':
        setDialogue('testprincess/tutorial');
        break;
      case 'princess':
        setDialogue('testprincess/birthdayPout');
        break;
      case 'princess2':
        setDialogue('testprincess/changeTime');
        break;
      default:
        break;
    }
  },
};
