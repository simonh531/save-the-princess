import { FC, useEffect, useState } from 'react';
import styled from 'styled-components';
import ChatIcon from '@material-ui/icons/Chat';
import { setDialogue } from '../data/state';
import { Topic } from '../utils/interfaces';
import NotificationDot from './notificationDot';
import * as Topics from '../topics';

const topicList:Record<string, Topic> = Topics;

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

function TopicListing({
  id, topic, focus, useTopic,
}:{
  // buggy
  // eslint-disable-next-line no-unused-vars
  id: string, topic: Topic, focus: string, useTopic: (topicId: string) => void
}) {
  const click = () => {
    if (!focus) {
      setDialogue(`topics/${id}`);
    } else {
      useTopic(id);
    }
  };
  return (
    <Listing onClick={click}>
      {topic.name}
    </Listing>
  );
}

interface Props {
  topics: Array<string>
  focus: string
  useTopic: () => void
}
const TopicsDrawer: FC<Props> = ({ topics, focus, useTopic }) => {
  const [offside, setOffside] = useState(true);
  const [notification, setNotification] = useState(false);
  const toggle = () => {
    setOffside(!offside);
    setNotification(false);
  };

  // basically enable the pulse when a topic is added
  useEffect(() => setNotification(true), [topics.length]);

  return (
    <Drawer offside={offside} visible={topics.length}>
      <Tab onClick={toggle}>
        <ChatIcon fontSize="large" />
        {notification ? <NotificationDot top="2px" right="2px" /> : null}
      </Tab>
      {topics.map((topicId) => (
        <TopicListing
          key={topicId}
          id={topicId}
          topic={topicList[topicId]}
          focus={focus}
          useTopic={useTopic}
        />
      ))}
    </Drawer>
  );
};

export default TopicsDrawer;
