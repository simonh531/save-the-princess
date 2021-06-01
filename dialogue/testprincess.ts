import { Dialogue } from '../utils/interfaces';
import {
  setDialogue, addTopic, addItem, setTime,
} from '../data/state';

export const tutorial:Dialogue[] = [
  {
    text: "Hey y'all! It's center princess's [birthday](0)!",
    actions: [
      ():void => {
        setDialogue('testprincess/birthdayReproach');
      },
    ],
    item: {
      fakeCake: () => setDialogue('testprincess/killMe'),
    },
  }, {
    text: "She's been kind of pouty recently...",
    next: '',
    item: {
      fakeCake: () => setDialogue('testprincess/killMe'),
    },
  },
];

export const birthdayReproach:Dialogue = {
  text: "Ohohoho, you didn't know? You really ought to make amends and say *something* to her **>:)**",
  next: '',
  effect: () => {
    addTopic('centerPrincessBirthday');
  },
  item: {
    fakeCake: () => setDialogue('testprincess/killMe'),
  },
};

export const killMe:Dialogue = {
  text: 'Are you trying to kill me???',
  next: '',
};

export const birthdayPout:Dialogue = {
  text: '**:(**',
  next: '',
  topic: {
    centerPrincessBirthday: () => {
      setDialogue('testprincess/giveBirthdayCake');
    },
  },
};

export const giveBirthdayCake:Dialogue = {
  text: 'I forgive you, now have this cake! **>:D**',
  next: '',
  effect: () => {
    addItem('fakeCake');
  },
};

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
};
