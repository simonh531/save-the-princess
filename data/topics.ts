import { Topic } from '../utils/interfaces';

const centerPrincessBirthday = {
  name: "Center Princess's Birthday",
  description: "You totally forgot about your best friend's birthday. What a friend you sure are.",
};

const kalvin = {
  name: 'Kalvin',
  description: "Hey that's me! I'm the dashing prince of Igrene and I have come to the Kingdom of Fidelia to claim my childhood sweetheart's hand in marriage. Oh, how I can't wait to see her!",
};

const topics:Record<string, Topic> = {
  centerPrincessBirthday,
  kalvin,
};

export default topics;
