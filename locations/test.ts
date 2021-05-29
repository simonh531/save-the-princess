import { Location } from '../utils/interfaces';

const test:Location = {
  background: '/assets/test/testfield.jpg',
  wallPlan: '/assets/test/testwallplan.png',
  floorPlan: '/assets/test/testfloorplan.png',
  ceilingPlan: '/assets/test/testceilingplan.png',
  walls: {
    255: {
      url: '/assets/test/testwall.png',
      geometry: '/assets/test/testwall.svg',
    },
  },
  floor: {
    ffffff: {
      url: '/assets/test/testground.jpg',
      repeat: 2,
    },
  },
  ceiling: {
    ffffff: {
      url: '/assets/test/testceiling.jpg',
      repeat: 3,
    },
  },
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
