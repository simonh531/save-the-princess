import { Dialogue } from '../utils/interfaces';
import {
  setDialogue, addTopic, // addItem, setTime,
} from '../data/state';

export const intro:Dialogue[] = [
  {
    text: "Finally awake [Kalvin](0)? I haven't seen you *sleep so peacefully in a while*. We should be arriving at the Fidelia Castle in just a few hours.",
    actions: [
      ():void => {
        addTopic('kalvin');
      },
    ],
    topic: {
      kalvin: () => setDialogue('kalvin'),
    },
  }, {
    text: "Are you excited? It's been quite a while since you last saw *Princess Annette*. Soon to be Queen Annette that is.",
    topic: {
      kalvin: () => setDialogue('kalvin'),
    },
  }, {
    text: 'I remember how smitten you were all those years ago. While you have the habit of running your mouth at even the slightest gust of air, she somehow managed to take your breath away.',
    topic: {
      kalvin: () => setDialogue('kalvin'),
    },
  }, {
    speaker: 'kalvin',
    text: '*I blushed in response. Normally I would have put up some excuse or protest, but Hyde knew me too well. Instead, I pouted and rolled my eyes.*',
    topic: {
      kalvin: () => setDialogue('kalvin'),
    },
  }, {
    text: "Well, I guess it's not all good news. It's quite the tragedy that her mother, Queen Marianne had passed in such fashion. I can't begin to imagine what Fidelia is going through right now. But for them to hold the Coronation festival so promptly tells me that they have a strong heart to move on.",
    next: '',
    topic: {
      kalvin: () => setDialogue('kalvin'),
    },
  },
];

export const kalvin:Dialogue = {
  text: "I've known you since you were but a little kid. Your father couldn't find you a tutor that could deal with your antics until I came along.",
  next: 'return',
};