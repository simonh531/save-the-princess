import { Location } from '../utils/interfaces';

const docks:Location = {
  background: '/assets/docks/docks.png',
  mapWidth: 15,
  mapHeight: 3,
  mapDepth: 15,
  cameraX: 7.5,
  cameraY: 0,
  cameraZ: 13.5,
  cameraHorizontalRange: Math.PI,
  cameraVerticalRange: Math.PI / 4,
  direction: 0,
  horizontalPlanes: [],
  entities: new Map([
    ['hyde', {
      meshId: 'hyde',
      x: 10.5,
      z: 10.5,
      activate: {
        focusId: 'hyde',
        dialogueId: 'hyde/changeTime',
      },
    }],
    ['present', {
      meshId: 'present',
      x: 6,
      z: 10.5,
      activate: {
        focusId: 'present',
        dialogueId: 'present/ackbar',
      },
    }],
  ]),
};

export default docks;
