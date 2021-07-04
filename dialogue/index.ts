import * as testprincess from './testprincess';
import * as hyde from './hyde';
import * as takero from './takero';
import * as present from './present';
import * as locations from './locations';
import { Dialogue } from '../utils/interfaces';

const dialogueList:Record<string, Record<string, Dialogue | Dialogue[]>> = {
  testprincess,
  hyde,
  takero,
  present,
  locations,
};

export default dialogueList;
