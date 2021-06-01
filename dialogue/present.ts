import { Dialogue } from '../utils/interfaces';
import { addItem } from '../data/state';

// eslint-disable-next-line import/prefer-default-export
export const pickup:Dialogue = {
  text: 'This looks like a good present',
  next: '',
  effect: () => addItem('present'),
};
