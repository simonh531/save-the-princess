import { focusId, setDialogue } from '../data/state';

export default {
  file: '/assets/testprincess/testprincess.png',
  geometry: '/assets/testprincess/testprincess.svg',
  height: 1.7,
  activate: ():void => {
    switch (focusId()) {
      case 'princess1':
        setDialogue('testprincess/tutorial0');
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
