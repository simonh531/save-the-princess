import {
  useState, useEffect, useRef, DependencyList,
} from 'react';
import { WindowSize } from './interfaces';

export function useWindowSize():WindowSize {
  // Initialize state with undefined width/height so server and client renders match
  // Learn more here: https://joshwcomeau.com/react/the-perils-of-rehydration/
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: undefined,
    height: undefined,
  });
  useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      // Set window width/height to state
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    // Add event listener
    window.addEventListener('resize', handleResize);
    // Call handler right away so state gets updated with initial window size
    handleResize();
    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty array ensures that effect is only run on mount
  return windowSize;
}

export function useMousePositionEffect(
  // eslint-disable-next-line no-unused-vars
  func: (x: number, y: number) => void,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deps?: DependencyList,
): void {
  const lastMouseX = useRef<number>();
  const lastMouseY = useRef<number>();

  function handleMove(event:MouseEvent) {
    lastMouseX.current = event.clientX;
    lastMouseY.current = event.clientY;
    func(event.clientX, event.clientY);
  }

  useEffect(() => {
    // so that it runs when hooks update too
    if (lastMouseX.current !== undefined && lastMouseY.current !== undefined) {
      func(lastMouseX.current, lastMouseY.current);
    }
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, deps);
}

export function useMouseAndWindowSizeEffect(
  // eslint-disable-next-line no-unused-vars
  func: (x?: number, y?: number, screenX?: number, screenY?: number) => void,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deps?: DependencyList,
): void {
  const lastMouseX = useRef<number>();
  const lastMouseY = useRef<number>();
  const screenX = useRef<number>();
  const screenY = useRef<number>();

  function handleResize() {
    screenX.current = window.innerWidth;
    screenY.current = window.innerHeight;
  }

  function handleMove(event:MouseEvent) {
    lastMouseX.current = event.clientX;
    lastMouseY.current = event.clientY;
    func(
      event.clientX,
      event.clientY,
      screenX.current,
      screenY.current,
    );
  }

  useEffect(() => {
    screenX.current = window.innerWidth;
    screenY.current = window.innerHeight;

    // so that it runs when hooks update too
    if (lastMouseX.current !== undefined && lastMouseY.current !== undefined) {
      func(
        lastMouseX.current,
        lastMouseY.current,
        screenX.current,
        screenY.current,
      );
    }
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('resize', handleResize);
    };
  }, deps);
}
