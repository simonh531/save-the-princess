import {
  FC, useState, useEffect, useRef, SetStateAction, Dispatch,
} from 'react';
import styled, { ThemeProvider, DefaultTheme } from 'styled-components';
import ReactMarkdown from 'react-markdown';
import { gql, useQuery } from '@apollo/client';
import { syllable } from 'syllable';
import { Dialogue } from '../utils/interfaces';
import Themes from '../styles/characterThemes';
import Dialogues from '../dialogue';
import { prevDialogue, setDialogue, unfocus } from '../data/state';
import { getAction, getText } from '../utils/getters';

const DIALOGUE = gql`
  query GetDialogueId {
    dialogueId
    checks
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

const Triangle = styled.div`
  position: absolute;
  left: calc(50% - 10px);
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
    nextIndex += 1;
  }
  return { newText, char, nextIndex };
}

const disallowed = ['hr'];
const speed = 30;

interface Props {
  setAdvance: Dispatch<SetStateAction<() => void>>
  advance: () => void
  setIsTalking: Dispatch<SetStateAction<boolean>>
  isTalking: boolean
}
const DialogueBox: FC<Props> = ({
  setAdvance, advance, setIsTalking, isTalking,
}) => {
  const { loading, /* error, */ data } = useQuery(DIALOGUE);
  const endDialogue = useRef(false);
  const [text, setText] = useState('');
  const { dialogueId, checks } = data;

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

  useEffect(() => {
    if (dialogueId && dialogue.effect && !wait) { // wait will make it run twice
      dialogue.effect();
    }
  }, [dialogueId]);
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
    let prevTime = -1;
    let prevSyllableCount = 0;
    let punctuationDelay = 0;
    const vowelBlip = new Audio();
    const consonantBlip = new Audio();
    function animate(timestamp: number) {
      if (start === undefined) {
        start = timestamp;
      }
      // ready for new letter
      if ((timestamp - start) / speed > prevTime) {
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
            if (syllable(nextNewText) > prevSyllableCount) {
              if (/[aeiouy]/.test(char.toLowerCase())) {
                try { vowelBlip.pause(); } catch (e) {
                  // console.log('missed play);
                }
                vowelBlip.currentTime = 0;
                vowelBlip.play();
              } else {
                try { consonantBlip.pause(); } catch (e) {
                  // console.log('missed play);
                }
                consonantBlip.currentTime = 0;
                consonantBlip.play();
              }
              prevSyllableCount = syllable(nextNewText);
            }
            setText(newText);
            prevTime += 1 + punctuationDelay;
            punctuationDelay = 0;
          } else {
            prevTime += 1;
          }
        }
      }
      if (oldText.charAt(index) && !endDialogue.current) {
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
          if (theme.vowel && theme.consonant) {
            vowelBlip.src = theme.vowel;
            consonantBlip.src = theme.consonant;
          }
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
        {isSpeech(keys[0]) && checks.identity !== dialogue.speaker
        && <Triangle />}
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
