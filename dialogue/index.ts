import * as testprincess from './testprincess';
import * as hyde from './hyde';
import * as present from './present';
import * as topics from './topics';
import * as items from './items';
import { Dialogue } from '../utils/interfaces';

const dialogueList:Record<string, Record<string, Dialogue | Dialogue[]>> = {
  testprincess,
  hyde,
  present,
  topics,
  items,
};

export default dialogueList;
