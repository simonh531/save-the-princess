import * as testprincess from './testprincess';
import * as topics from './topics';
import * as items from './items';
import { Dialogue } from '../utils/interfaces';

const dialogueList:Record<string, Record<string, Dialogue>> = {
  testprincess,
  topics,
  items,
};

export default dialogueList;
