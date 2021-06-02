import { gql, useQuery } from '@apollo/client';
import { FC } from 'react';
import styled from 'styled-components';
import { Dialogue, StateItem } from '../utils/interfaces';
import Dialogues from '../dialogue';
import Topics from '../data/topics';
import Items from '../data/items';
import { setDialogue } from '../data/state';

const USABLE_DIALOGUE = gql`
  query GetChecks {
    dialogueId
    topics
    items
    checks
  }
`;

const Drawer = styled.div<{ visible: number }>`
  grid-area: rightBottom;
  display: flex;
  flex-direction: column;
  border-radius: 4px;
  position: relative;
  bottom: 0;
  background-color: white;
  pointer-events: ${(props) => (props.visible ? 'auto' : 'none')};
  left: ${(props) => (props.visible ? '0' : '20px')};
  opacity: ${(props) => (props.visible ? '0.95' : '0')};
  font-size: 1.2em;
  overflow: hidden;
  filter: drop-shadow(0 0 2px rgba(0,0,0,0.2));

  transition: 0.4s left, 0.4s right, 0.4s opacity;
`;

const Choice = styled.div`
  padding: 6px 10px;
  font-size: 1.2em;
  cursor: pointer;
  user-select: none;
  
  :hover {
    background-color: rgba(0,0,0,0.1);
  }

  :active {
    background-color: ${(props) => (props.theme.backgroundColor)};
    color: ${(props) => (props.theme.color)};
    box-shadow: 0 0 2px 2px rgba(0,0,0,0.1);
  }
`;

const choiceDrawer: FC = () => {
  const { loading, /* error, */ data } = useQuery(USABLE_DIALOGUE);
  const {
    dialogueId, topics, items,
  }:{
    dialogueId: string, topics:string[], items:StateItem[],
  } = data;

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

  if (loading || !data) {
    return null;
  }

  return (
    <Drawer visible={actions.length}>
      {actions.map((action) => (
        <Choice onClick={action.action}>
          {action.name}
        </Choice>
      ))}
    </Drawer>
  );
};

export default choiceDrawer;
