import { setLocation } from '../data/state';
import { Checks, Location } from '../utils/interfaces';

const test:Location = {
  background: '/assets/test/testfield.png',
  mapWidth: 15,
  mapHeight: 3,
  mapDepth: 15,
  cameraX: 7.5,
  cameraY: 0,
  cameraZ: 13.5,
  cameraHorizontalRange: Math.PI / 2,
  cameraVerticalRange: Math.PI / 4,
  direction: 0,
  walls: [{
    plan: '/assets/test/testwallplan.png',
    tiles: new Map([[
      '128', {
        map: '/assets/test/testwall.png',
        colors: [0xffffff],
        geometry: '/assets/test/testwall.svg',
      },
    ]]),
    unit: 3,
  }],
  horizontalPlanes: [
    {
      plan: '/assets/test/testfloorplan.png',
      tiles: new Map([[
        'ffffff', {
          map: '/assets/test/testground.jpg',
          repeat: 2,
          clearcoat: 1,
        },
      ]]),
      unit: 3,
      clipBelow: true,
    },
    {
      plan: '/assets/test/testceilingplan.png',
      tiles: new Map([[
        'ffffff', {
          map: '/assets/test/testceiling.jpg',
          repeat: 3,
        },
      ]]),
      unit: 3,
    },
  ],
  entities: new Map([
    ['testprincess1', {
      meshId: 'testprincess',
      x: 4.5,
      z: 12,
      activate: {
        focusId: 'testprincess1',
        dialogueId: 'testprincess/tutorial',
      },
    }],
    ['testprincess2', {
      meshId: 'testprincess',
      x: 7.2,
      z: 6,
      activate: {
        focusId: 'testprincess2',
        dialogueId: 'testprincess/birthdayPout',
      },
    }],
    ['takero', {
      meshId: 'takero',
      x: 10.5,
      z: 12,
      activate: {
        focusId: 'takero',
        dialogueId: 'takero/changeTime',
      },
    }],
    ['hyde', {
      meshId: 'hyde',
      x: 8.7,
      z: 10.5,
      activate: () => setLocation('carriage'),
    }],
    ['present', {
      meshId: 'present',
      x: 6,
      z: 10.5,
      activate: {
        focusId: 'present',
        dialogueId: 'present/pickup',
      },
      visible: (checks:Checks) => !checks.presentTaken,
    }],
  ]),
};

export default test;
