import { Dialogue } from '../utils/interfaces';
import { addItem, unfocus } from '../data/state';
import { setCheck } from '../data/checks';

export const pickup:Dialogue = {
  text: 'This looks like a good present. Do you want to take it?',
  choice: {
    Yes: () => {
      addItem('present');
      setCheck('presentTaken', true);
      unfocus();
    },
    No: unfocus,
  },
};

export const ackbar:Dialogue = {
  text: "It's a trap!",
  next: '',
};
