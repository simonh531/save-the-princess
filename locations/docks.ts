import { Location } from '../utils/interfaces';

const test:Location = {
  background: '/assets/docks/docks.jpg',
  groundLight: 0x000080,
  skyLight: 0x87cefa,
  mapWidth: 5,
  mapDepth: 5,
  cameraX: 2,
  cameraZ: 4,
  direction: 0,
  horizontalPlanes: [],
  entities: {
    hyde: {
      meshId: 'hyde',
      x: 3,
      z: 3,
      activate: 'hyde/intro',
    },
    present: {
      meshId: 'present',
      x: 1.5,
      z: 3,
      activate: 'present/ackbar',
    },
  },
};

export default test;
