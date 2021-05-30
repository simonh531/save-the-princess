import { Location } from '../utils/interfaces';

const test:Location = {
  background: '/assets/test/testfield.jpg',
  groundLightTexture: '/assets/test/testground.jpg',
  skyLightTexture: '/assets/test/testceiling.jpg',
  walls: {
    plan: '/assets/test/testwallplan.png',
    tiles: {
      255: {
        url: '/assets/test/testwall.png',
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
    princess: {
      entityId: 'testprincess',
      x: 1.9,
      z: 1.5,
      clickable: true,
    },
    princess1: {
      entityId: 'testprincess',
      x: 1,
      z: 3.5,
      clickable: true,
    },
    princess2: {
      entityId: 'testprincess',
      x: 3,
      z: 3.5,
      clickable: true,
    },
  },
};

export default test;
