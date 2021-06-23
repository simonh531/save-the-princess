import { gql, useQuery } from '@apollo/client';
import {
  FC, ReactNode, useState, useEffect, useRef,
} from 'react';
import styled from 'styled-components';
import { StateItem } from '../utils/interfaces';
import Topics from '../data/topics';
import Items from '../data/items';
import { getAction } from '../utils/getters';

import { useDialogueData } from '../utils/hooks';
// import { useThemeSounds } from '../utils/hooks';

const USABLE_DIALOGUE = gql`
  query GetChecks {
    dialogueId
    topics
    items
    checks
  }
`;

const Drawer = styled.div<{ visible: boolean }>`
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

  transition: 0.4s left, 0.4s opacity;
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

const ChoiceDrawer: FC<{isTalking: boolean}> = ({ isTalking }) => {
  const { loading, /* error, */ data } = useQuery(USABLE_DIALOGUE);
  const { topics, items }:{ topics:string[], items:StateItem[] } = data;
  const lastDrawer = useRef(Date.now());
  const drawerToRemove = useRef(0);
  const lastDialogue = useRef<string>();
  const [drawerData, setDrawerData] = useState<Record<string, {
    visible: boolean,
    actions: ReactNode[],
  }>>({
    [lastDrawer.current]: {
      visible: false,
      actions: [],
    },
  });
  // const { playHoverSound, withClickSound } = useThemeSounds();

  const dialogue = useDialogueData();

  useEffect(() => {
    let timeoutId = 0;
    function removeOldDrawer() {
      if (drawerToRemove.current) {
        const removeIndex = drawerToRemove.current;
        setDrawerData((oldDrawerData) => ({
          ...oldDrawerData,
          [removeIndex]: {
            ...oldDrawerData[removeIndex],
            visible: false,
          },
        }));
        drawerToRemove.current = 0;
        timeoutId = window.setTimeout(() => {
          setDrawerData((oldDrawerData) => {
            const newData = { ...oldDrawerData };
            delete newData[removeIndex];
            return newData;
          });
        }, 400);
      }
    }
    if (!dialogue) {
      removeOldDrawer();
      lastDialogue.current = '';
    } else if (dialogue.id !== lastDialogue.current) {
      removeOldDrawer();
    }

    if (!isTalking && dialogue) {
      const actions:ReactNode[] = [];
      const {
        topic, item, choice, id: dialogueId,
      } = dialogue;
      if (choice) {
        Object.entries(choice).forEach(([name, action]) => {
          actions.push(
            <Choice
              onClick={
                  // withClickSound(
                    getAction(action)
                  // )
                }
                // onMouseEnter={playHoverSound}
              key={`choice/${name}`}
            >
              {name}
            </Choice>,
          );
        });
      }
      if (topic) {
        topics.forEach((id) => {
          if (topic[id]) {
            actions.push(
              <Choice
                onClick={
                    // withClickSound(
                      getAction(topic[id])
                    // )
                  }
                  // onMouseEnter={playHoverSound}
                key={`topic/${id}`}
              >
                &quot;
                {Topics[id].name}
                &quot;
              </Choice>,
            );
          }
        });
      }
      if (item) {
        items.forEach(({ id }) => {
          if (item[id]) {
            actions.push(
              <Choice
                onClick={
                    // withClickSound(
                      getAction(item[id])
                    // )
                  }
                  // onMouseEnter={playHoverSound}
                key={`item/${id}`}
              >
                {Items[id].name}
              </Choice>,
            );
          }
        });
      }
      if (lastDialogue.current === dialogueId) {
        if (actions.length) {
          const editingDrawer = drawerToRemove.current;
          setDrawerData((oldDrawerData) => ({
            ...oldDrawerData,
            [editingDrawer]: {
              visible: true,
              actions,
            },
          }));
        } else {
          removeOldDrawer();
        }
      } else if (actions.length) {
        removeOldDrawer();
        const nextKey = Date.now();
        const editingDrawer = lastDrawer.current;
        setDrawerData((oldDrawerData) => ({
          ...oldDrawerData,
          [editingDrawer]: {
            visible: true,
            actions,
          },
          [nextKey]: {
            visible: false,
            actions: [],
          },
        }));
        drawerToRemove.current = lastDrawer.current;
        lastDrawer.current = nextKey;
      }
      lastDialogue.current = dialogueId;
    }
    if (timeoutId) {
      return () => clearTimeout(timeoutId);
    }
    return () => { /* do nothing */ };
  }, [isTalking, dialogue, items, topics]);

  if (loading || !data) {
    return null;
  }

  return (
    <>
      {Object.entries(drawerData).map(([key, objectDrawerData]) => (
        <Drawer visible={objectDrawerData.visible} key={key}>
          {objectDrawerData.actions}
        </Drawer>
      ))}
    </>
  );
};

export default ChoiceDrawer;
