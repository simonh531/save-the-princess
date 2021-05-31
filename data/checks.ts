import { makeVar } from '@apollo/client';

export const checks = makeVar({});

export function setCheck(checkName: string, value: string | number | boolean):void {
  checks({
    ...checks(),
    [checkName]: value,
  });
}
