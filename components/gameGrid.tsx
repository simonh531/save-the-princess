import {
  FC, ReactNode, useEffect, useState,
} from 'react';
import styled, { ThemeProvider } from 'styled-components';
import { gql, useQuery } from '@apollo/client';
import MenuDrawer from './menuDrawer';
import InfoDrawer from './infoDrawer';
import ChoiceDrawer from './choiceDrawer';
import Dialogues from '../dialogue';
import Topics from '../data/topics';
import Items from '../data/items';
import Themes from '../styles/characterThemes';
import { Dialogue, StateItem } from '../utils/interfaces';
import { setDialogue } from '../data/state';

const USABLE_DIALOGUE = gql`
  query GetUsableDialogue {
    dialogueId
    topics
    items
    checks
  }
`;

const Grid = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  overflow: hidden;
  padding: 20px;
  pointer-events: none;
  display: grid;
  column-gap: 8px;
  grid-template-columns: 1fr 60% 1fr;
  grid-template-rows: auto 200px;
  grid-template-areas:
    "left top right"
    "left dialogueBox right";
`;

const RightSide = styled.div`
  grid-area: right;
  display: flex;
  flex-direction: column;
  position: relative;
`;

const GameGrid: FC<{children: ReactNode}> = ({ children }) => {
  const { loading, /* error, */ data } = useQuery(USABLE_DIALOGUE);
  const [infoId, setInfoId] = useState('');
  const [visible, setVisible] = useState(false);

  const {
    dialogueId, topics, items, checks,
  }:{
    dialogueId: string, topics:string[], items:StateItem[], checks:Record<string, number>
  } = data;

  const open = (infoText:string) => {
    setInfoId(infoText);
    setVisible(true);
  };

  const close = () => {
    setVisible(false);
  };

  const actions:{name: string, action: () => void}[] = [];
  if (dialogueId) {
    const keys = dialogueId.split('/');
    if (Dialogues[keys[0]] && Dialogues[keys[0]][keys[1]]) {
      const temp = Dialogues[keys[0]][keys[1]];
      let dialogue:Dialogue;
      if (Array.isArray(temp)) {
        if (keys[2]) {
          dialogue = temp[parseInt(keys[2], 10)];
        } else {
          [dialogue] = temp;
        }
      } else {
        dialogue = temp;
      }
      const dialogueTopic = dialogue.topic;
      if (dialogueTopic) {
        topics.forEach((id) => {
          if (dialogueTopic[id]) {
            let action:() => void;
            const actionTemp = dialogueTopic[id];
            if (typeof actionTemp === 'string') {
              action = () => setDialogue(actionTemp);
            } else {
              action = actionTemp;
            }
            actions.push({
              name: Topics[id].name,
              action,
            });
          }
        });
      }
      const dialogueItem = dialogue.item;
      if (dialogueItem) {
        items.forEach(({ id }) => {
          if (dialogueItem[id]) {
            let action:() => void;
            const actionTemp = dialogueItem[id];
            if (typeof actionTemp === 'string') {
              action = () => setDialogue(actionTemp);
            } else {
              action = actionTemp;
            }
            actions.push({
              name: Items[id].name,
              action,
            });
          }
        });
      }
    }
  }

  useEffect(() => {
    if (!visible) {
      const id = setTimeout(setInfoId, 400, '');
      return () => clearTimeout(id);
    }
    return () => { /* do nothing */ };
  }, [visible]);

  if (loading || !data) {
    return null;
  }

  return (
    <Grid>
      <ThemeProvider theme={Themes[checks.identity]}>
        {children}
        <MenuDrawer setInfoId={open} close={close} infoId={infoId} />
        <RightSide>
          <InfoDrawer infoId={infoId} visible={visible} choiceVisible={actions.length} />
          <ChoiceDrawer actions={actions} />
        </RightSide>
      </ThemeProvider>
    </Grid>
  );
};

export default GameGrid;
