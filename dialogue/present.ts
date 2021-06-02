import { Dialogue } from '../utils/interfaces';
import { addItem, unfocus } from '../data/state';
import { setCheck } from '../data/checks';

// eslint-disable-next-line import/prefer-default-export
export const pickup:Dialogue = {
  text: 'This looks like a good present',
  next: '',
  nextAction: () => {
    addItem('present');
    setCheck('presentTaken', true);
    unfocus();
  },
};
