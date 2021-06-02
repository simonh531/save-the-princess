import { Item } from '../utils/interfaces';
import { time } from './state';
import { timeToAmPm } from '../utils/timeTo';

const fakeCake: Item = {
  name: 'Cake?',
  description: "This cake kinda smells. Are you sure it's okay to eat?",
};

const present: Item = {
  name: 'Present',
  description: 'This looks like a really really good present.',
};

const pocketwatch: Item = {
  name: 'Pocket Watch',
  description: () => `This nice pocket watch says that the time is ${timeToAmPm(time())}`,
};

const items:Record<string, Item> = {
  fakeCake,
  present,
  pocketwatch,
};

export default items;
