import { Skill } from '../utils/interfaces';

const offensiveMagic = {
  name: 'Offensive Magic',
};

const defensiveMagic = {
  name: 'Defensive Magic',
};

const roguecraft = {
  name: 'Roguecraft',
};

const marksmanship = {
  name: 'Marksmanship',
};

const swordplay = {
  name: 'Swordplay',
};

const diplomacy = {
  name: 'Diplomacy',
};

const acrobatics = {
  name: 'Acrobatics',
};

const medicine = {
  name: 'Medicine',
};

const dance = {
  name: 'Dance',
};

const skills:Record<string, Skill> = {
  offensiveMagic,
  defensiveMagic,
  roguecraft,
  marksmanship,
  swordplay,
  diplomacy,
  acrobatics,
  medicine,
  dance,
};

export default skills;
