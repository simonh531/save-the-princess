import { focus, setDialogue } from '../data/state';

export default {
  file: '/assets/test/testprincess.png',
  height: 0.7,
  activate: ():void => {
    switch (focus()) {
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
