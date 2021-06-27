import { Location } from '../utils/interfaces';

const test:Location = {
  background: '/assets/docks/docks.png',
  groundLight: 0x000080,
  skyLight: 0x87cefa,
  mapWidth: 5,
  mapDepth: 5,
  cameraX: 2,
  cameraZ: 4,
  cameraHorizontalRange: Math.PI,
  cameraVerticalRange: Math.PI / 4,
  direction: 0,
  horizontalPlanes: [],
  entities: [
    {
      meshId: 'hyde',
      x: 3,
      z: 3,
      focusPositionId: 'hyde',
      activate: {
        focusId: 'hyde',
        dialogueId: 'hyde/changeTime',
      },
    },
    {
      meshId: 'present',
      x: 1.5,
      z: 3,
      focusPositionId: 'present',
      activate: {
        focusId: 'present',
        dialogueId: 'present/ackbar',
      },
    },
  ],
};

export default test;
