import { gql, useQuery } from '@apollo/client';
import { useEffect, useRef } from 'react';
import {
  PMREMGenerator, Scene, Texture, WebGLRenderer,
  // PlaneGeometry, MeshBasicMaterial, Mesh,
} from 'three';
// import { cleanup } from './meshCleanup';

const TIMELOCATION = gql`
  query GetTimeLocation {
    time,
    locationId,
  }
`;

function useEnvMap(
  renderer: WebGLRenderer | undefined,
  scene: Scene,
  everythingLoaded: boolean,
):void {
  const { data } = useQuery(TIMELOCATION);
  const envMap = useRef<Texture>(new Texture());
  const {
    time, locationId,
  } = data;

  useEffect(() => {
    if (renderer && scene && everythingLoaded) {
      // eslint-disable-next-line no-param-reassign
      scene.environment = null;
      const pmremGenerator = new PMREMGenerator(renderer);
      for (let i = 0; i < 4; i += 1) { // number of envmap loops to get a good color
        envMap.current = pmremGenerator.fromScene(scene).texture;
        // eslint-disable-next-line no-param-reassign
        scene.environment = envMap.current;
      }
      envMap.current.dispose();
      pmremGenerator.dispose();

      // const testplane = new PlaneGeometry(3, 3);
      // const testmaterial = new MeshBasicMaterial({
      //   map: envMap.current,
      // });
      // const testMesh = new Mesh(testplane, testmaterial);
      // scene.add(testMesh);
      // return () => cleanup(testMesh);
    }
    // return () => { /* do nothing */ };
  }, [renderer, scene, everythingLoaded, time, locationId]);
}

export default useEnvMap;
