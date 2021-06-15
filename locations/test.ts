import { Location } from '../utils/interfaces';
import { checks } from '../data/checks';

const test:Location = {
  background: '/assets/test/testfield.jpg',
  groundLight: '/assets/test/testground.jpg',
  skyLight: '/assets/test/testceiling.jpg',
  mapWidth: 5,
  mapDepth: 5,
  cameraX: 2,
  cameraZ: 4,
  direction: 0,
  walls: {
    plan: '/assets/test/testwallplan.png',
    tiles: {
      255: {
        url: '/assets/test/testwall.png',
        colors: [0xffffff],
        geometry: '/assets/test/testwall.svg',
      },
    },
  },
  horizontalPlanes: [
    {
      plan: '/assets/test/testfloorplan.png',
      tiles: {
        ffffff: {
          url: '/assets/test/testground.jpg',
          repeat: 2,
          clearcoat: 1,
        },
      },
    },
    {
      plan: '/assets/test/testceilingplan.png',
      tiles: {
        ffffff: {
          url: '/assets/test/testceiling.jpg',
          repeat: 3,
        },
      },
    },
  ],
  entities: {
    princess1: {
      meshId: 'testprincess',
      x: 1,
      z: 3.5,
      activate: 'testprincess/tutorial',
    },
    princess: {
      meshId: 'testprincess',
      x: 1.9,
      z: 1.5,
      activate: 'testprincess/birthdayPout',
    },
    princess2: {
      meshId: 'testprincess',
      x: 3,
      z: 3.5,
      activate: 'testprincess/changeTime',
    },
    hyde: {
      meshId: 'hyde',
      x: 2.4,
      z: 3,
      activate: 'hyde/intro',
    },
    present: {
      meshId: 'present',
      x: 1.5,
      z: 3,
      activate: 'present/pickup',
      visible: () => !checks().presentTaken,
    },
  },
};

export default test;
