import { Dialogue } from '../utils/interfaces';
import { addTopic, addItem } from '../data/state';

export const tutorial:Dialogue[] = [
  {
    text: "Hey y'all! It's center princess's [birthday](0)!",
    actions: [
      'testprincess/birthdayReproach',
    ],
    item: {
      fakeCake: 'testprincess/killMe',
    },
  }, {
    text: "She's been kind of pouty recently...",
    next: '',
    item: {
      fakeCake: 'testprincess/killMe',
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
    fakeCake: 'testprincess/killMe',
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
    centerPrincessBirthday: 'testprincess/giveBirthdayCake',
  },
};

export const giveBirthdayCake:Dialogue = {
  text: 'I forgive you, now have this cake! **>:D**',
  next: '',
  effect: () => {
    addItem('fakeCake');
  },
};
