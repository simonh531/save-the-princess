import {
  FC, useState, useEffect, useRef, SetStateAction, Dispatch,
} from 'react';
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';
import { gql, useQuery } from '@apollo/client';
import { Dialogue } from '../../utils/interfaces';
import * as styles from './styles';
import Dialogues from '../../dialogue';
import { prevDialogue, setDialogue, unfocus } from '../../data/state';

const DIALOGUE = gql`
  query GetDialogueId {
    dialogueId
  }
`;

const Box = styled.div<{ visible: string, extra: string }>`
  grid-area: dialogueBox;
  display: flex;
  flex-direction: column;
  border-radius: 4px;
  box-shadow: 0 0 2px 2px rgba(0,0,0,0.3);
  padding: 10px;
  padding-top: 0px;
  opacity: ${(props) => (props.visible ? '0.95' : '0')};
  pointer-events: auto;
  ${(props) => props.extra}

  transition: 0.4s opacity;
`;

const TextBox = styled.div`
  flex: 1;
  font-size: 1.2em;
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

  :hover {
    opacity: 0.8
  }
`;

const boxStyles:Record<string, string> = styles;

function isSpeech(theme: string) {
  if (theme === 'description' || theme === 'thought' || theme === 'location') {
    return false;
  }
  return true;
}

function setEmptyDialogue(text: string, theme: string) {
  if (isSpeech(theme)) {
    const line = text.match(/\[(?=.+?\]\(.+?\))|\]\(.+?\)/g);
    if (line) {
      return line.join('');
    }
  } else {
    return text;
  }
  return '';
}

const disallowed = ['hr'];
const speed = 25;

interface Props {
  setAdvance: Dispatch<SetStateAction<() => void>>
  advance: () => void
}
const DialogueBox: FC<Props> = ({
  setAdvance, advance,
}) => {
  const { loading, /* error, */ data } = useQuery(DIALOGUE);
  const endDialogue = useRef(false);
  const [isTalking, setIsTalking] = useState(false);
  const [text, setText] = useState('');
  const { dialogueId } = data;

  let wait = false;
  let isSequence = false;
  let sequenceLength = 0;
  let keys = [''];
  let dialogue: Dialogue;
  let theme = '';
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
      if (dialogue.speaker) {
        theme = dialogue.speaker;
      } else {
        [theme] = keys;
      }
    } else {
      theme = '';
    }
  }

  // handle dialogue box
  useEffect(() => {
    if (dialogueId && dialogue.effect) {
      dialogue.effect();
    }
  }, [dialogueId]);
  useEffect(() => {
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
      } else if (typeof dialogue.next === 'string') {
        if (dialogue.next === '') {
          // should happen
          setAdvance(() => () => {
            unfocus();
          });
        } else if (dialogue.next === 'return') {
          setAdvance(() => () => {
            prevDialogue();
          });
        } else {
          setAdvance(() => () => {
            setDialogue(dialogue.next || '');
          });
        }
      }
    } else { // changed to no dialogue
      setAdvance(() => () => { /* do nothing */ });
    }
  }, [dialogueId, isTalking]);

  useEffect(() => {
    let newText = '';
    let start: number;
    let id: number;
    let index = 0;
    let prevTime = -1;
    function animate(timestamp: number) {
      if (start === undefined) {
        start = timestamp;
      }
      // ready for new letter
      if ((timestamp - start) / speed > prevTime) {
        let char = dialogue.text.charAt(index);
        // fastforward through markdown characters
        while (char && newText.charAt(index) === char) {
          index += 1;
          char = dialogue.text.charAt(index);
        }
        let asteriskLength = 0;
        // this will only happen for the first asterisks as
        // the second set gets skipped by the first while loop
        while (char === '*') {
          index += 1;
          char = dialogue.text.charAt(index);
          asteriskLength += 1;
        }
        if (char) {
          newText = `${newText.slice(0, index)}${'*'.repeat(asteriskLength)}${char}${'*'.repeat(asteriskLength)}${newText.slice(index)}`;
          if (char !== ' ') { // trailing spaces cause trouble
            setText(newText);
          }
          index += 1;
          prevTime += 1;
        }
      }
      if (dialogue.text.charAt(index) && !endDialogue.current) {
        id = requestAnimationFrame(animate);
      } else {
        setText(dialogue.text);
        setIsTalking(false);
        endDialogue.current = false;
      }
    }

    setText(newText);

    if (isSpeech(theme) && !wait) { // need to wait or else runs back to back
      if (dialogueId) {
        setIsTalking(true);
        newText = setEmptyDialogue(dialogue.text, theme);
        id = requestAnimationFrame(animate);
      }
      return () => cancelAnimationFrame(id);
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
      if (dialogueId && dialogue.actions && dialogue.actions[parseInt(href, 10)]) {
        action = dialogue.actions[parseInt(href, 10)];
      }
      return (
        <ActionText onClick={action}>
          {children}
        </ActionText>
      );
    },
  };

  return (
    <Box visible={dialogueId} extra={boxStyles[theme]}>
      <TextBox onClick={isTalking ? advance : () => { /* do nothing */ }}>
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
  );
};

export default DialogueBox;
