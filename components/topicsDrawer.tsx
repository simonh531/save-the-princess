import { FC, useEffect, useState } from 'react';
import styled from 'styled-components';
import ChatIcon from '@material-ui/icons/Chat';
import { gql, useQuery } from '@apollo/client';
import { Dialogue, Topic } from '../utils/interfaces';
import NotificationDot from './notificationDot';
import * as Topics from '../topics';
import Dialogues from '../dialogue';
import { setDialogue } from '../data/state';

const topicList:Record<string, Topic> = Topics;

const TOPICS = gql`
  query GetTopics {
    dialogueId
    topics
  }
`;

const Drawer = styled.div<{ offside: boolean, visible: number }>`
  grid-area: topics;
  display: flex;
  flex-direction: column;
  border-radius: 4px 0 4px 4px;
  padding: 10px 30px;
  pointer-events: auto;
  background-color: white;
  position: relative;
  right: ${(props) => (props.offside ? 'calc(100% + 20px)' : '0')};
  opacity: ${(props) => (props.visible ? '0.95' : '0')};

  transition: 0.4s right, 0.4s opacity;
`;

const Tab = styled.div`
  position: absolute;
  top: 0;
  left: 100%;
  width: 44px;
  padding-right: 4px;
  height: 48px;
  border-radius: 0 50% 50% 0;
  background-color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Listing = styled.div`
  font-size: 1.6em;
  cursor: pointer;
  user-select: none;
`;

function TopicListing({ name, useTopic }:{ name: string, useTopic: () => void }) {
  return (
    <Listing onClick={useTopic}>
      {name}
    </Listing>
  );
}

const makeUseTopic = (dialogueId: string, id: string) => {
  let action = () => { /* do nothing */ };
  if (dialogueId) {
    const keys = dialogueId.split('/');
    if (Dialogues[keys[0]] && Dialogues[keys[0]][keys[1]]) {
      const temp = Dialogues[keys[0]][keys[1]];
      let dialogue: Dialogue;
      if (!Array.isArray(temp) || keys.length === 3) {
        if (Array.isArray(temp)) {
          dialogue = temp[parseInt(keys[2], 10)];
        } else {
          dialogue = temp;
        }
        if (dialogue.topic && dialogue.topic[id]) {
          const actionTemp = dialogue.topic[id];
          if (typeof actionTemp === 'string') {
            action = () => setDialogue(actionTemp);
          } else {
            action = actionTemp;
          }
        } else {
          action = () => setDialogue(`topics/${id}`);
        }
      }
    }
  } else {
    action = () => setDialogue(`topics/${id}`);
  }
  return action;
};

const TopicsDrawer: FC = () => {
  const { loading, /* error, */ data } = useQuery(TOPICS);
  const [offside, setOffside] = useState(true);
  const [notification, setNotification] = useState(false);
  const toggle = () => {
    setOffside(!offside);
    setNotification(false);
  };
  const { topics, dialogueId }: {topics: string[], dialogueId: string} = data;

  // basically enable the pulse when a topic is added
  useEffect(() => setNotification(true), [topics.length]);

  if (loading || !data) {
    return null;
  }

  return (
    <Drawer offside={offside} visible={topics.length}>
      <Tab onClick={toggle}>
        <ChatIcon fontSize="large" />
        {notification ? <NotificationDot top="2px" right="2px" /> : null}
      </Tab>
      {topics.map((topicId) => (
        <TopicListing
          key={topicId}
          name={topicList[topicId].name}
          useTopic={makeUseTopic(dialogueId, topicId)}
        />
      ))}
    </Drawer>
  );
};

export default TopicsDrawer;
