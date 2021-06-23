/* eslint-disable react-hooks/exhaustive-deps */
import { gql, useQuery } from '@apollo/client';
import {
  useState, useEffect, useRef, DependencyList, useMemo,
} from 'react';
import { useTheme } from 'styled-components';
import { DialogueData, WindowSize } from './interfaces';
import Themes from '../styles/characterThemes';
import Dialogues from '../dialogue';

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

export function useWindowSizeEffect(
  // eslint-disable-next-line no-unused-vars
  func: (x: number, y: number) => void,
  deps?: DependencyList,
):void {
  function handleResize() {
    func(window.innerWidth, window.innerHeight);
  }
  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, deps);
}

export function useMousePositionEffect(
  // eslint-disable-next-line no-unused-vars
  func: (x: number, y: number) => void,
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

export function useThemeSounds():{
  playHoverSound: () => void
  // eslint-disable-next-line no-unused-vars
  withClickSound: (func: () => void) => () => void
  } {
  const { consonant, vowel } = useTheme();
  const [playHoverSound, setPlayHoverSound] = useState(() => () => { /* do nothing */ });
  const [withClickSound, setWithClickSound] = useState(() => (func:() => void) => () => func());

  useEffect(() => {
    const hover = new Audio(vowel);
    const click = new Audio(consonant);
    setPlayHoverSound(() => () => hover.play());
    setWithClickSound(() => (func:() => void) => () => {
      click.play();
      func();
    });
  }, [consonant, vowel]);

  return { playHoverSound, withClickSound };
}

const DIALOGUE = gql`
  query GetDialogueId {
    dialogueId
  }
`;

export function useDialogueData():DialogueData | null {
  const { data } = useQuery(DIALOGUE);
  const { dialogueId }:{ dialogueId: string } = data;

  const dialogue = useMemo<null | DialogueData>(() => {
    if (dialogueId) {
      let sequenceLength;
      const [speaker, textId, stringIndex] = dialogueId.split('/');
      if (Dialogues[speaker] && Dialogues[speaker][textId]) {
        let holder = Dialogues[speaker][textId];
        if (Array.isArray(holder)) {
          sequenceLength = holder.length;
          let index = parseInt(stringIndex, 10);
          if (Number.isNaN(index)) {
            // setDialogue(`${dialogueId}/0`);
            index = 0;
            [holder] = holder;
          } else {
            holder = holder[index];
          }
          if (index < sequenceLength - 1) {
            holder.next = `${speaker}/${textId}/${index + 1}`;
          }
        }
        let speakerData:string;
        if (holder.speaker) {
          speakerData = holder.speaker;
        } else {
          speakerData = speaker;
        }
        let nextText = '';
        if (holder.next !== undefined && !holder.nextText) {
          if (holder.next === '') {
            nextText = 'End';
          } else if (holder.next === 'return') {
            nextText = 'Return ⮌';
          } else {
            nextText = 'Continue ➤';
          }
        }
        let isSpeech = true;
        if (!speaker || speaker === 'present' || speaker === 'locations') {
          isSpeech = false;
        }
        let theme = Themes.defaultTheme;
        if (isSpeech) {
          if (holder.speaker) {
            theme = Themes[holder.speaker];
          } else {
            theme = Themes[speaker];
          }
        }
        return {
          ...holder,
          id: dialogueId,
          nextText,
          speaker: speakerData,
          isSpeech,
          theme,
        };
      }
    }
    return null;
  }, [dialogueId]);
  return dialogue;
}
