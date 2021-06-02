import { makeVar } from '@apollo/client';

export const checks = makeVar({
  presentTaken: false,
  identity: 'kalvin',
  offensiveMagicMod: 0,
  offensiveMagicMin: 0,
  defensiveMagicMod: 0,
  defensiveMagicMin: 0,
  roguecraftMod: 0,
  roguecraftMin: 0,
  marksmanshipMod: 0,
  marksmanshipMin: 0,
  swordplayMod: 0,
  swordplayMin: 0,
  diplomacyMod: 0,
  diplomacyMin: 0,
  acrobaticsMod: 0,
  acrobaticsMin: 0,
  medicineMod: 0,
  medicineMin: 0,
  danceMod: 0,
  danceMin: 0,
});

export function setCheck(checkName: string, value: string | number | boolean):void {
  checks({
    ...checks(),
    [checkName]: value,
  });
}
