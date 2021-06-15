import { Dialogue } from '../utils/interfaces';
import { setLocation, unfocus } from '../data/state';

export const test:Dialogue = {
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
  text: 'Nevermind. It smells here. The weird [triplet princesses](0) were better company.',
  actions: [
    ():void => {
      setLocation('test');
      unfocus();
    },
  ],
  next: '',
};
