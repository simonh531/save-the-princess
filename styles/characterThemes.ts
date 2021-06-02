import { Theme } from '../utils/interfaces';

const testprincess = {
  backgroundColor: 'pink',
  color: 'black',
};

const hyde = {
  backgroundColor: 'antiquewhite',
  color: 'black',
};

const kalvin = {
  backgroundColor: 'lightskyblue',
  color: 'black',
};

const themes:Record<string, Theme> = {
  testprincess,
  hyde,
  kalvin,
};

export default themes;
