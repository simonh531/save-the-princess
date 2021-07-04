import { addCommand, setTime } from '../data/state';
import { Dialogue } from '../utils/interfaces';

// eslint-disable-next-line import/prefer-default-export
export const changeTime:Dialogue = {
  text: `Would you like to change the time? [9:00](0), [10:00](1), [11:00](2), [12:00](3), [13:00](4),
  [14:00](5), [15:00](6), [16:00](7), [17:00](8), [18:00](9), [19:00](10), [20:00](11), [21:00](12),
  [22:00](13), [23:00](14), [24:00](15)`,
  next: '',
  actions: [
    ():void => setTime(9),
    ():void => setTime(10),
    ():void => setTime(11),
    ():void => setTime(12),
    ():void => setTime(13),
    ():void => setTime(14),
    ():void => setTime(15),
    ():void => setTime(16),
    ():void => setTime(17),
    ():void => setTime(18),
    ():void => setTime(19),
    ():void => setTime(20),
    ():void => setTime(21),
    ():void => setTime(22),
    ():void => setTime(23),
    ():void => setTime(24),
  ],
  choice: {
    'Set Attack': 'attack',
    'Set Neutral': 'ellipsis',
  },
};

export const attack:Dialogue = {
  text: 'Attack!',
  next: '',
  effect: () => addCommand('takero', 'changeMesh', { mesh: 'attack' }),
};

export const ellipsis:Dialogue = {
  text: '...',
  next: '',
  effect: () => addCommand('takero', 'changeMesh', { mesh: 'default' }),
};
