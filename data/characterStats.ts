import { CharacterStats } from '../utils/interfaces';

const kalvin = {
  eyeHeight: 1.5,
  skills: {
    offensiveMagic: 1,
    defensiveMagic: 2,
    roguecraft: 0,
    marksmanship: 0,
    swordplay: 0,
    diplomacy: 1,
    acrobatics: 0,
    medicine: 0,
    dance: 0,
  },
};

const hyde = {
  eyeHeight: 1.6,
  skills: {
    offensiveMagic: 3,
    defensiveMagic: 2,
    roguecraft: 1,
    marksmanship: 1,
    swordplay: 1,
    diplomacy: 1,
    acrobatics: 1,
    medicine: 1,
    dance: 1,
  },
};

const characterStats:Record<string, CharacterStats> = {
  kalvin,
  hyde,
};

export default characterStats;
