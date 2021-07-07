import { Dialogue } from '../utils/interfaces';
import { setLocation, unfocus } from '../data/state';

export const test:Dialogue = {
  speakerFocusPositionId: '',
  text: 'This place is a dump. Even the [docks](0) are nicer.',
  actions: [
    ():void => {
      setLocation('docks');
      unfocus();
    },
  ],
  next: '',
};

export const docks:Dialogue = {
  speakerFocusPositionId: '',
  text: 'Nevermind. It smells here. The weird [twin princesses](0) were better company.',
  actions: [
    ():void => {
      setLocation('test');
      unfocus();
    },
  ],
  next: '',
};

export const carriage:Dialogue = {
  speakerFocusPositionId: '',
  text: 'This bumpy road is making you sick. You struggle to not throw up.',
  next: '',
};
