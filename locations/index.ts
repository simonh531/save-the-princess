import test from './test';
import docks from './docks';
import carriage from './carriage';
import { Location } from '../utils/interfaces';

const locations:Record<string, Location> = {
  test,
  docks,
  carriage,
};

export default locations;
