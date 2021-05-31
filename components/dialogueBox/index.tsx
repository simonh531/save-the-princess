import {
  FC, useState, useEffect, MutableRefObject,
} from 'react';
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';
import { Dialogue } from '../../utils/interfaces';
import * as styles from './styles';

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
  font-size: 1.6em;
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
  dialogue: Dialogue
  theme: string
  advance: () => void
  isTalking: boolean
  // eslint-disable-next-line no-unused-vars
  setIsTalking: (a: boolean) => void
  endDialogue: MutableRefObject<boolean>,
}
const DialogueBox: FC<Props> = ({
  dialogue, theme, advance, isTalking, setIsTalking, endDialogue,
}) => {
  const [text, setText] = useState(setEmptyDialogue(dialogue.text, theme));

  useEffect(() => {
    let newText = setEmptyDialogue(dialogue.text, theme);
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
          setText(newText);
          index += 1;
          prevTime += 1;
        }
      }
      if (dialogue.text.charAt(index) && !endDialogue.current) {
        id = requestAnimationFrame(animate);
      } else {
        setText(dialogue.text);
        setIsTalking(false);
        // eslint-disable-next-line no-param-reassign
        endDialogue.current = false;
      }
    }

    setText(newText);

    if (isSpeech(theme)) {
      if (dialogue.text) {
        setIsTalking(true);
        id = requestAnimationFrame(animate);
      }
      return () => cancelAnimationFrame(id);
    }

    return () => { /* do nothing */ };
  }, [dialogue.text, endDialogue]);

  let continueText;
  if (typeof dialogue.next === 'string') {
    if (dialogue.next === '') {
      continueText = 'End';
    } else {
      continueText = 'Continue ➤';
    }
  }

  const components = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    a(props: any) { // this type is broken
      const { children, href } = props;
      let action = () => { /* do nothing */ };
      if (dialogue.actions && dialogue.actions[parseInt(href, 10)]) {
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
    <Box visible={dialogue.text} extra={boxStyles[theme]}>
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
