import { Vector3 } from 'three';

const takero = {
  file: '/assets/takero/default.png',
  geometry: '/assets/takero/default.svg',
  height: 1.85,
  cameraAdjustment: new Vector3(0, 0.3, 0),
  alt: {
    attack: {
      file: '/assets/takero/attack.png',
      geometry: '/assets/takero/attack.svg',
      height: 2.1,
    },
  },
};

export default takero;
