import {
  FC, useState, useEffect, useRef, SetStateAction, Dispatch,
} from 'react';
import styled, { ThemeProvider, DefaultTheme } from 'styled-components';
import ReactMarkdown from 'react-markdown';
import { gql, useQuery } from '@apollo/client';
import { Camera, Vector3 } from 'three';
import { syllable } from 'syllable';
import { Dialogue } from '../utils/interfaces';
import Themes from '../styles/characterThemes';
import Dialogues from '../dialogue';
import { prevDialogue, setDialogue, unfocus } from '../data/state';
import { getAction, getText } from '../utils/getters';

const DIALOGUE = gql`
  query GetDialogueId {
    dialogueId
    focusId
  }
`;

const Box = styled.div<{ visible: string }>`
  position: relative;
  grid-area: dialogueBox;
  display: flex;
  flex-direction: column;
  border-radius: 4px;
  padding: 10px;
  padding-top: 0px;
  opacity: ${(props) => (props.visible ? '0.95' : '0')};
  pointer-events: ${(props) => (props.visible ? 'auto' : 'none')};
  background-color: ${(props) => props.theme.backgroundColor};
  color: ${(props) => props.theme.color};
  filter: drop-shadow(0 0 2px rgba(0,0,0,0.2));

  transition: 0.4s opacity${(props) => (props.visible ? '' : ', background-color 0s 0.4s')};
`; // turn on the transition for when it's on its way out

const TextBox = styled.div<{clickThrough: boolean}>`
  flex: 1;
  font-size: 1.4em;
  pointer-events: ${(props) => (props.clickThrough ? 'none' : 'auto')};
`;

const ActionText = styled.span`
  color: blue;
  cursor: pointer;

  :hover {
    opacity: 0.8
  }
`;

const ContinueBox = styled.div`
  text-align: right;
  font-size: 1.2em;
  cursor: pointer;
  user-select: none;

  :hover {
    opacity: 0.7
  }
`;

const Triangle = styled.div.attrs<{position: number}>(({ position }) => ({
  style: {
    left: `calc(${50 + position * 100}% - 10px)`,
  },
}))<{position: number}>`
  position: absolute;
  bottom: 100%;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-bottom: 30px solid ${(props) => props.theme.backgroundColor};
`;

function isSpeech(speaker: string) {
  if (
    !speaker
    || speaker === 'present'
    || speaker === 'locations'
  ) {
    return false;
  }
  return true;
}

function setEmptyDialogue(text: string) {
  const line = text.match(/\[(?=.+?\]\(.+?\))|\]\(.+?\)/g);
  if (line) {
    return line.join('');
  }
  return '';
}

function processNextChar(text: string, oldText: string, index: number) {
  let newText = text;
  let nextIndex = index;
  let char = oldText.charAt(nextIndex);
  // fastforward through markdown characters
  while (char && text.charAt(nextIndex) === char) {
    nextIndex += 1;
    char = oldText.charAt(nextIndex);
  }
  let asteriskLength = 0;
  // this will only happen for the first asterisks as the
  // second set after gets skipped by the first while loop
  while (char === '*') {
    nextIndex += 1;
    char = oldText.charAt(nextIndex);
    asteriskLength += 1;
  }
  if (char) {
    newText = `${
      newText.slice(0, nextIndex)}${
      '*'.repeat(asteriskLength)}${char}${
      '*'.repeat(asteriskLength)}${
      newText.slice(nextIndex)
    }`;
  }
  nextIndex += 1;
  return { newText, char, nextIndex };
}

const disallowed = ['hr'];
const speed = 30;

const DialogueBox: FC<{
  setAdvance: Dispatch<SetStateAction<() => void>>
  advance: () => void
  setIsTalking: Dispatch<SetStateAction<boolean>>
  isTalking: boolean
  camera: Camera
  focusPositions: Record<string, Vector3>
}> = ({
  setAdvance, advance, setIsTalking, isTalking, camera, focusPositions,
}) => {
  const { loading, /* error, */ data } = useQuery(DIALOGUE);
  const endDialogue = useRef(false);
  const voices = useRef<Record<string, {
    vowel: HTMLAudioElement,
    consonant: HTMLAudioElement
  } >>({});
  const [text, setText] = useState('');
  // const [speakerFocusPositionId, setSpeakerFocusPositionId] = useState('');
  const [trianglePosition, setTrianglePosition] = useState(0);
  const { dialogueId, focusId } = data;

  let wait = false;
  let isSequence = false;
  let sequenceLength = 0;
  let keys = [''];
  let dialogue: Dialogue = {
    text: '',
  };
  let theme: DefaultTheme = {
    backgroundColor: 'transparent',
    color: 'transparent',
  };
  let continueText;

  if (dialogueId) {
    keys = dialogueId.split('/');
    if (Dialogues[keys[0]] && Dialogues[keys[0]][keys[1]]) {
      const temp = Dialogues[keys[0]][keys[1]];
      if (Array.isArray(temp)) {
        isSequence = true;
        sequenceLength = temp.length;
        if (keys.length !== 3) { // no index
          keys.push('0');
          setDialogue(`${dialogueId}/0`);
          wait = true;
        }
        dialogue = temp[parseInt(keys[2], 10)];
      } else {
        dialogue = temp;
      }
      if (dialogue.next === '') {
        continueText = 'End';
      } else if (dialogue.next === 'return') {
        continueText = 'Return ⮌';
      } else if (dialogue.next || (isSequence && parseInt(keys[2], 10) < sequenceLength)) {
        continueText = 'Continue ➤';
      }
      if (isSpeech(keys[0])) {
        if (dialogue.speaker) {
          theme = Themes[dialogue.speaker];
        } else {
          theme = Themes[keys[0]];
        }
      } else {
        theme = {
          backgroundColor: 'white',
          color: 'black',
        };
      }
    }
  }

  // load all blips
  useEffect(() => {
    Object.entries(Themes).forEach(([id, characterTheme]) => {
      if (characterTheme.vowel && characterTheme.consonant) {
        voices.current[id] = {
          vowel: new Audio(characterTheme.vowel),
          consonant: new Audio(characterTheme.consonant),
        };
      }
    });
  }, []);

  useEffect(() => {
    if (dialogueId) {
      if (dialogue.effect && !wait) { // wait will make it run twice
        dialogue.effect();
      }
    //   if (typeof dialogue.speakerFocusPositionId === 'string') {
    //     setSpeakerFocusPositionId(dialogue.speakerFocusPositionId);
    //   } else if (!(isSequence && parseInt(keys[2], 10) > 0)) {
    //     setSpeakerFocusPositionId(focusId);
    //   }
    // } else {
    //   setSpeakerFocusPositionId('');
    }
  }, [dialogueId]);

  useEffect(() => {
    let animationFrameId = 0;
    let prevPositionX = 0;
    const position = new Vector3();

    function animate() {
      position.copy(focusPositions[dialogue.speakerFocusPositionId || focusId]);
      position.project(camera);
      setTrianglePosition(position.x);
      if (
        Math.abs(position.x - prevPositionX) > 0.00001
      ) {
        prevPositionX = position.x;
        animationFrameId = requestAnimationFrame(animate);
      }
    }
    if (focusId && dialogue.speakerFocusPositionId !== '') {
      animationFrameId = requestAnimationFrame(animate);
      return () => {
        cancelAnimationFrame(animationFrameId);
      };
    }
    return () => { /* do nothing */ };
  }, [dialogueId, focusId, focusPositions]);

  useEffect(() => { // handle advance
    if (dialogueId) { // changed to new dialogue
      if (isTalking) {
        setAdvance(() => () => {
          endDialogue.current = true;
        });
      } else if (isSequence && parseInt(keys[2], 10) < sequenceLength - 1) {
        setAdvance(() => () => {
          keys[2] = `${parseInt(keys[2], 10) + 1}`;
          setDialogue(keys.join('/'));
        });
      } else if (dialogue.nextAction) {
        const { nextAction } = dialogue;
        setAdvance(() => nextAction);
      } else if (typeof dialogue.next === 'string') {
        const { next } = dialogue;
        if (next === '') {
          setAdvance(() => unfocus);
        } else if (next === 'return') {
          setAdvance(() => prevDialogue);
        } else {
          setAdvance(() => () => {
            setDialogue(next || '');
          });
        }
      }
    } else { // changed to no dialogue
      setAdvance(() => () => { /* do nothing */ });
    }
  }, [dialogueId, isTalking]);

  useEffect(() => { // handle text scroll
    let newText = '';
    let nextNewText = '';
    let char = '';
    let nextChar = '';
    const oldText = getText(dialogue.text);
    let start: number;
    let id: number;
    let index = 0;
    let nextTime = -1;
    let prevSyllableCount = 0;
    let punctuationDelay = 0;
    function animate(timestamp: number) {
      if (start === undefined) {
        start = timestamp;
      }
      // ready for new letter
      if ((timestamp - start) / speed > nextTime) {
        // have next character ready too so that syllable can make better predictions
        newText = nextNewText;
        char = nextChar;
        const processed = processNextChar(nextNewText, oldText, index);
        nextNewText = processed.newText;
        nextChar = processed.char;
        index = processed.nextIndex;
        if (char) {
          if (char !== ' ') { // trailing spaces cause trouble
            if (/[.?!]/.test(char)) {
              punctuationDelay = 6;
            } else if (/,/.test(char)) {
              punctuationDelay = 3;
            }
            if (syllable(nextNewText) > prevSyllableCount && voices.current[keys[0]]) {
              const { vowel, consonant } = voices.current[dialogue.speaker || keys[0]];
              if (/[aeiouy]/.test(char.toLowerCase())) {
                vowel.pause();
                vowel.currentTime = 0;
                vowel.play();
              } else {
                consonant.pause();
                consonant.currentTime = 0;
                consonant.play();
              }
              prevSyllableCount = syllable(nextNewText);
            }
            setText(newText);
            nextTime += 1 + punctuationDelay;
            punctuationDelay = 0;
          } else {
            nextTime += 1;
          }
        }
      }
      if (oldText.charAt(index - 1) && !endDialogue.current) {
        // the actual index is one behind the one we use for syllables
        id = requestAnimationFrame(animate);
      } else {
        setText(oldText);
        setIsTalking(false);
        endDialogue.current = false;
      }
    }

    if (isSpeech(keys[0])) {
      if (!wait) { // need to wait or else runs back to back
        newText = setEmptyDialogue(oldText);
        const processed = processNextChar(newText, oldText, 0);
        nextNewText = processed.newText;
        nextChar = processed.char;
        index = processed.nextIndex;
        if (nextChar) {
          setIsTalking(true);
          id = requestAnimationFrame(animate);
          return () => cancelAnimationFrame(id);
        }
        // runs if immediately completed because only one character
        setText(dialogue.text);
      }
    } else { // is not speech
      setText(dialogue.text);
    }
    return () => { /* do nothing */ };
  }, [dialogueId]);

  if (loading || !data) {
    return null;
  }

  const components = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    a(props: any) { // this type is broken
      const { children, href } = props;
      let action = () => { /* do nothing */ };
      if (isTalking) {
        action = advance;
      } else if (dialogue.actions && dialogue.actions[parseInt(href, 10)]) {
        action = getAction(dialogue.actions[parseInt(href, 10)]);
      }
      return (
        <ActionText onClick={action}>
          {children}
        </ActionText>
      );
    },
    img: () => '!',
  };

  return (
    <ThemeProvider theme={theme}>
      <Box visible={dialogueId} onClick={isTalking ? advance : () => { /* do nothing */ }}>
        {dialogue.speakerFocusPositionId !== '' && <Triangle position={trianglePosition} />}
        <TextBox clickThrough={isTalking || !dialogueId}>
          <ReactMarkdown components={components} disallowedElements={disallowed}>
            {text}
          </ReactMarkdown>
        </TextBox>
        {continueText && (
          <ContinueBox onClick={advance}>
            {continueText}
          </ContinueBox>
        )}
      </Box>
    </ThemeProvider>
  );
};

export default DialogueBox;
