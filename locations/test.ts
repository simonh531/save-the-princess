import { Checks, Location } from '../utils/interfaces';

const test:Location = {
  background: '/assets/test/testfield.png',
  groundLight: '/assets/test/testground.jpg',
  skyLight: '/assets/test/testceiling.jpg',
  mapWidth: 5,
  mapDepth: 5,
  cameraX: 2,
  cameraZ: 4,
  cameraHorizontalRange: Math.PI / 2,
  cameraVerticalRange: Math.PI / 4,
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
  entities: new Map([
    ['testprincess1', {
      meshId: 'testprincess',
      x: 1,
      z: 3.5,
      activate: {
        focusId: 'testprincess1',
        dialogueId: 'testprincess/tutorial',
      },
    }],
    ['testprincess2', {
      meshId: 'testprincess',
      x: 1.9,
      z: 1.5,
      activate: {
        focusId: 'testprincess2',
        dialogueId: 'testprincess/birthdayPout',
      },
    }],
    ['takero', {
      meshId: 'takero',
      x: 3,
      z: 3.5,
      activate: {
        focusId: 'takero',
        dialogueId: 'takero/changeTime',
      },
    }],
    ['hyde', {
      meshId: 'hyde',
      x: 2.4,
      z: 3,
      activate: {
        focusId: 'hyde',
        dialogueId: 'hyde/intro',
      },
    }],
    ['present', {
      meshId: 'present',
      x: 1.5,
      z: 3,
      activate: {
        focusId: 'present',
        dialogueId: 'present/pickup',
      },
      visible: (checks:Checks) => !checks.presentTaken,
    }],
  ]),
};

export default test;
