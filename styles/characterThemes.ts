import { DefaultTheme } from 'styled-components';

const testprincess = {
  backgroundColor: 'pink',
  color: 'black',
  vowel: '/assets/testprincess/testprincessVowel.wav',
  consonant: '/assets/testprincess/testprincessConsonant.wav',
};

const hyde = {
  backgroundColor: 'antiquewhite',
  color: 'black',
  vowel: '/assets/hyde/hydeVowel.wav',
  consonant: '/assets/hyde/hydeConsonant.wav',
};

const kalvin = {
  backgroundColor: 'lightskyblue',
  color: 'black',
  vowel: '/assets/kalvin/kalvinVowel.wav',
  consonant: '/assets/kalvin/kalvinConsonant.wav',
};

const defaultTheme = {
  backgroundColor: 'white',
  color: 'black',
};

const themes:Record<string, DefaultTheme> = {
  testprincess,
  hyde,
  kalvin,
  defaultTheme,
};

export default themes;
