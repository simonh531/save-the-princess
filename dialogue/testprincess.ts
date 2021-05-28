import { Dialogue } from '../utils/interfaces';
import { setDialogue, addTopic, addItem } from '../data/state';

export const tutorial0:Dialogue = {
  text: "Hey y'all! It's center princess's [birthday](0)!",
  next: 'testprincess/tutorial1',
  actions: [
    ():void => {
      setDialogue('testprincess/birthdayReproach');
    },
  ],
  item: {
    fakeCake: () => setDialogue('testprincess/killMe'),
  },
};

export const tutorial1:Dialogue = {
  text: "She's been kind of pouty recently...",
  next: '',
  item: {
    fakeCake: () => setDialogue('testprincess/killMe'),
  },
};

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
  text: 'Would you like to change the time?',
  next: '',
};
