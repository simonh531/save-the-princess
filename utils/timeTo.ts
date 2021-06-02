// eslint-disable-next-line import/prefer-default-export
export const timeToAmPm = (time: number): string => {
  const dayTime = time % 24;
  const numberTime = ((time + 11) % 12) + 1;
  if (dayTime < 12) {
    return `${numberTime} a.m.`;
  }
  return `${numberTime} p.m.`;
};
