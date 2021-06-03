import { gql, useQuery } from '@apollo/client';
import { FC, ReactNode } from 'react';
import styled from 'styled-components';
import { Dialogue, StateItem } from '../utils/interfaces';
import Dialogues from '../dialogue';
import Topics from '../data/topics';
import Items from '../data/items';
import { getAction } from '../utils/getters';

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
  font-size: 1.1em;
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

  const actions:ReactNode[] = [];
  if (dialogueId) {
    const keys = dialogueId.split('/');
    if (Dialogues[keys[0]] && Dialogues[keys[0]][keys[1]]) {
      const temp = Dialogues[keys[0]][keys[1]];
      let dialogue:Dialogue;
      if (Array.isArray(temp)) {
        if (keys[2]) {
          dialogue = temp[parseInt(keys[2], 10)];
        } else {
          [dialogue] = temp; // index 0
        }
      } else {
        dialogue = temp;
      }
      const dialogueTopic = dialogue.topic;
      if (dialogueTopic) {
        topics.forEach((id) => {
          if (dialogueTopic[id]) {
            actions.push(
              <Choice onClick={getAction(dialogueTopic[id])} key={`topic/${id}`}>
                &quot;
                {Topics[id].name}
                &quot;
              </Choice>,
            );
          }
        });
      }
      const dialogueItem = dialogue.item;
      if (dialogueItem) {
        items.forEach(({ id }) => {
          if (dialogueItem[id]) {
            actions.push(
              <Choice onClick={getAction(dialogueItem[id])} key={`item/${id}`}>
                {Items[id].name}
              </Choice>,
            );
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
      {actions}
    </Drawer>
  );
};

export default choiceDrawer;
