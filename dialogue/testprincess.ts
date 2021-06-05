import { Dialogue } from '../utils/interfaces';
import {
  setDialogue, addTopic, addItem, setTime,
} from '../data/state';

export const tutorial0:Dialogue = {
  text: "Finally awake [Kalvin](0)? I haven't seen you *sleep so peacefully in a while*. We should be arriving at the Fidelia Castle in just a few hours.",
  next: 'testprincess/tutorial1',
  actions: [
    ():void => {
      addTopic('kalvin');
    },
  ],
  item: {
    fakeCake: () => setDialogue('testprincess/killMe'),
  },
  topic: {
    kalvin: () => setDialogue('testprincess/kalvin')
  }
};
export const kalvin:Dialogue = {
  text: "I've known you since you were but a little kid. Your father couldn't find you a tutor that could deal with your antics until I came along.",
  next: ''
}

export const tutorial1:Dialogue = {
  text: "Are you excited? It's been quite a while since you last saw *Princess Annette*. Soon to be Queen Annette that is.",
  next: 'testprincess/tutorial2',
  item: {
    fakeCake: () => setDialogue('testprincess/killMe'),
  },
  topic: {
    kalvin: () => setDialogue('testprincess/kalvin')
  }
};
export const tutorial2:Dialogue = {
  text: " I remember how smitten you were all those years ago. While you have the habit of running your mouth at even the slightest gust of air, she somehow managed to take your breath away.",
  next: 'testprincess/tutorial3',
  topic: {
    kalvin: () => setDialogue('testprincess/kalvin')
  }
}

export const tutorial3:Dialogue = {
  text:"*I blushed in response. Normally I would have put up some excuse or protest, but Hyde knew me too well. Instead, I pouted and rolled my eyes.*" ,
  next: 'testprincess/tutorial4',
  topic: {
    kalvin: () => setDialogue('testprincess/kalvin')
  }
}
export const tutorial4:Dialogue = {
 text:"Well, I guess it's not all good news. It's quite the tragedy that her mother, Queen Marianne had passed in such fashion. I can't begin to imagine what Fidelia is going through right now. But for them to hold the Coronation festival so promptly tells me that they have a strong heart to move on." ,
  next: '',
  topic: {
    kalvin: () => setDialogue('testprincess/kalvin')
  }
}
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
