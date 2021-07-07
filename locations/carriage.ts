import { Location } from '../utils/interfaces';

const carriage:Location = {
  background: '/assets/test/testfield.png',
  mapWidth: 2,
  mapHeight: 2,
  mapDepth: 2.5,
  cameraX: 1,
  cameraY: -0.25,
  cameraZ: 1.85,
  cameraHorizontalRange: Math.PI / 2,
  cameraVerticalRange: Math.PI / 3,
  direction: 0,
  walls: [
    {
      plan: '/assets/carriage/wall0.png',
      tiles: new Map([
        ['128', {
          color: 0x624a2e,
        }],
        ['192', {
          color: 0x383b3e,
        }],
      ]),
      unit: 0.5,
    },
    {
      plan: '/assets/carriage/wall1.png',
      tiles: new Map([
        ['64', {
          color: 0x966f33,
        }],
        ['128', {
          color: 0x624a2e,
        }],
        ['192', {
          color: 0x383b3e,
        }],
      ]),
      unit: 0.5,
      aspect: 3 / 2,
    },
    {
      plan: '/assets/carriage/wall2.png',
      tiles: new Map([
        ['64', {
          color: 0x966f33,
          geometry: '/assets/carriage/leftCorner.svg',
        }],
        ['128', {
          color: 0x966f33,
          geometry: '/assets/carriage/rightCorner.svg',
        }],
        ['192', {
          color: 0x383b3e,
          geometry: '/assets/carriage/doorWindow.svg',
        }],
        ['200', {
          color: 0x624a2e,
          geometry: '/assets/carriage/seatBack.svg',
        }],
      ]),
      unit: 0.5,
      aspect: 2 / 3,
    },
  ],
  horizontalPlanes: [
    {
      plan: '/assets/carriage/floor.png',
      tiles: new Map([[
        '888888', {
          color: 0x111111,
        },
      ]]),
      unit: 0.5,
      clipBelow: true,
    },
    {
      plan: '/assets/carriage/seats.png',
      tiles: new Map([[
        '808080', {
          color: 0x624a2e,
        },
      ]]),
      unit: 0.5,
      clipBelow: true,
    },
    { unit: 7 / 12 },
    {
      plan: '/assets/carriage/ceiling.png',
      tiles: new Map([[
        '808080', {
          color: 0x966f33,
        },
      ]]),
      unit: 0.5,
    },
  ],
  entities: new Map([
    ['hyde', {
      meshId: 'hyde',
      x: 1,
      y: -0.25,
      z: 0.65,
      activate: {
        focusId: 'hyde',
        dialogueId: 'hyde/intro',
      },
    }],
  ]),
};

export default carriage;
