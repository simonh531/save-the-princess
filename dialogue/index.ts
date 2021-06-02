import * as testprincess from './testprincess';
import * as hyde from './hyde';
import * as present from './present';
import { Dialogue } from '../utils/interfaces';

const dialogueList:Record<string, Record<string, Dialogue | Dialogue[]>> = {
  testprincess,
  hyde,
  present,
};

export default dialogueList;
