import {
  FC, useEffect, useRef, useState,
} from 'react';
import ReactMarkdown from 'react-markdown';
import styled from 'styled-components';
import MenuIcon from '@material-ui/icons/Menu';
import ChatIcon from '@material-ui/icons/Chat';
import BusinessCenterIcon from '@material-ui/icons/BusinessCenter';
import AccessibilityNewIcon from '@material-ui/icons/AccessibilityNew';
import { gql, useQuery } from '@apollo/client';
import Topics from '../data/topics';
import Items from '../data/items';
import * as CharacterStats from '../data/characterStats';
import Skills from '../data/skills';
import { StateItem } from '../utils/interfaces';
import { getText, getAction } from '../utils/getters';
import { useThemeSounds } from '../utils/hooks';
// import NotificationDot from './notificationDot';

const characterStats:Record<string, Record<string, number>> = CharacterStats;

const USABLES = gql`
  query GetUsables {
    topics
    items
    checks
  }
`;

const Drawer = styled.div<{ offside: boolean }>`
  grid-area: left;
  display: flex;
  flex-direction: column;
  border-radius: 4px 0 4px 4px;
  pointer-events: auto;
  background-color: white;
  position: relative;
  right: ${(props) => (props.offside ? 'calc(100% + 20px)' : '0')};
  opacity: 0.95;
  filter: drop-shadow(0 0 2px rgba(0,0,0,0.2));

  transition: 0.4s right, 0.4s opacity;
`;

const Tab = styled.div`
  position: absolute;
  top: 0;
  left: 100%;
  width: 48px;
  height: 48px;
  border-radius: 0 50% 50% 0;
  background-color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const IconPadding = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  border-radius: 50%;

  :hover {
    background-color: ${(props) => props.theme.backgroundColor};
    color: ${(props) => props.theme.color};
  }
`;

const MenuTabs = styled.div`
  padding: 4px 0;
  display: flex;
  justify-content: space-evenly;
`;

const MenuTab = styled.div<{active: boolean, top?: string}>`
  width: 40px;
  height: 40px;
  padding-top: ${(props) => props.top};
  background-color: ${(props) => (props.active ? props.theme.backgroundColor : 'transparent')};
  color: ${(props) => (props.active ? props.theme.color : 'black')};
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  box-shadow: ${(props) => (props.active ? '0 0 2px 2px rgba(0,0,0,0.1)' : '')};

  ${(props) => (props.active ? '' : `
    :hover {
      background-color: rgba(0,0,0,0.1);
    }
  `)}
`;

const ListItem = styled.div<{active?: boolean}>`
  padding: 6px 10px;
  font-size: 1.2em;
  cursor: pointer;
  user-select: none;
  background-color: ${(props) => (props.active ? props.theme.backgroundColor : 'transparent')};
  color: ${(props) => (props.active ? props.theme.color : 'black')};
  box-shadow: ${(props) => (props.active ? '0 0 2px 2px rgba(0,0,0,0.1)' : '')};
  
  ${(props) => (props.active ? '' : `
    :hover {
      background-color: rgba(0,0,0,0.1);
    }
  `)}
`;

const Listing = styled.div`
  flex: 1;
`;

const Info = styled.div<{visible: string}>`
  position: relative;
  height: ${(props) => (props.visible ? '200px' : '0')};
  padding: 0 10px;

  transition: height 0.4s;
`;

const Line = styled.div`
  height: 1px;
  background-color: black;
  position: absolute;
  top: 0;
  left: 5%;
  right: 5%;
`;

const levelName = ['Basic', 'Intermediate', 'Advanced'];

const calcStats = (base: Record<string, number>, checks: Record<string, number>) => {
  const calculatedStats:Record<string, number> = {};
  Object.entries(base).forEach(([key, value]) => {
    calculatedStats[key] = Math.max(
      value + checks[`${key}Mod`],
      checks[`${key}Min`],
    );
  });
  return calculatedStats;
};

const ActionText = styled.span`
  color: blue;
  cursor: pointer;

  :hover {
    opacity: 0.8
  }
`;

const H3 = styled.h3`
  margin-block-end: 0;
`;

const disallowed = ['hr'];

const MenuDrawer: FC = () => {
  const { loading, /* error, */ data } = useQuery(USABLES);
  const [offside, setOffside] = useState(true);
  const [activeTab, setActiveTab] = useState('topics');
  const [infoId, setInfoId] = useState('');
  const itemSound = useRef<HTMLAudioElement>();
  const topicSound = useRef<HTMLAudioElement[]>([]);
  // const [notification, setNotification] = useState(false);
  const {
    // playHoverSound,
    withClickSound,
  } = useThemeSounds();

  // const toggle = withClickSound(() => setOffside(!offside));
  const toggle = () => setOffside(!offside);
  const { topics, items, checks } = data;

  useEffect(() => {
    if (itemSound.current) {
      itemSound.current.play();
    } else {
      itemSound.current = new Audio('/assets/item.ogg');
    }
  }, [items]);

  useEffect(() => {
    if (topicSound.current.length === 3) {
      topicSound.current[Math.floor((Math.random() * 3) % 3)].play();
    } else {
      topicSound.current.push(
        new Audio('/assets/topic1.ogg'),
        new Audio('/assets/topic2.ogg'),
        new Audio('/assets/topic3.ogg'),
      );
    }
  }, [topics]);

  useEffect(() => setInfoId(''), [activeTab]); // close info when tab switches
  useEffect(() => {
    if (!offside) {
      setInfoId('');
    }
  }, [offside]); // close info when reopening

  // basically enable the pulse when a topic is added
  // useEffect(() => setNotification(true), [topics.length]);

  let listing = [];
  if (activeTab === 'topics') {
    listing = topics.map((id: string) => (
      <ListItem
        key={id}
        onClick={
          // withClickSound(
            () => setInfoId(`topic/${id}}`)
          // )
        }
        // onMouseEnter={playHoverSound}
        active={infoId === `topic/${id}`}
      >
        {Topics[id].name}
      </ListItem>
    ));
  } else if (activeTab === 'items') {
    listing = items.map((item: StateItem) => (
      <ListItem
        key={item.id}
        onClick={
          // withClickSound(
            () => setInfoId(`item/${item.id}`)
          // )
        }
        // onMouseEnter={playHoverSound}
        active={infoId === `item/${item.id}`}
      >
        {Items[item.id].name}
        {item.quantity > 1 ? ` × ${item.quantity}` : ''}
      </ListItem>
    ));
  } else if (activeTab === 'skills') {
    const baseSkills = characterStats[checks.identity];
    const calculatedStats = calcStats(baseSkills, checks);
    Object.entries(calculatedStats).forEach(([id, level]) => {
      if (level) {
        listing.push(
          <ListItem key={id}>
            {Skills[id].name}
            :
            {' '}
            {levelName[level - 1]}
          </ListItem>,
        );
      }
    });
  }

  useEffect(() => { // handle keyboard
    function handleKeydown(event:KeyboardEvent) {
      switch (event.code) {
        case 'KeyT':
          withClickSound(() => {
            if (!offside && activeTab === 'topics') {
              setOffside(true);
            } else {
              setActiveTab('topics');
              setOffside(false);
            }
          })();
          break;
        case 'KeyI':
          withClickSound(() => {
            if (!offside && activeTab === 'items') {
              setOffside(true);
            } else {
              setActiveTab('items');
              setOffside(false);
            }
          })();
          break;
        case 'KeyS':
          withClickSound(() => {
            if (!offside && activeTab === 'skills') {
              setOffside(true);
            } else {
              setActiveTab('skills');
              setOffside(false);
            }
          })();
          break;
        default:
          break;
      }
    }
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [offside, activeTab]);

  let title = '';
  let text = '';
  let actionList: (string | (() => void))[];
  const keys = infoId.split('/');
  if (keys[0] === 'topic') {
    title = Topics[keys[1]].name;
    const { description, actions } = Topics[keys[1]];
    text = getText(description);
    if (actions) {
      actionList = actions;
    }
  } else if (keys[0] === 'item') {
    title = Items[keys[1]].name;
    const { description, actions } = Items[keys[1]];
    text = getText(description);
    if (actions) {
      actionList = actions;
    }
  }

  const components = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    a(props: any) { // this type is broken
      const { children, href } = props;
      return (
        <ActionText
          onClick={
            // withClickSound(
              getAction(actionList[parseInt(href, 10)])
            // )
          }
          // onMouseEnter={playHoverSound}
        >
          {children}
        </ActionText>
      );
    },
    h3: H3,
  };

  if (loading || !data) {
    return null;
  }

  return (
    <Drawer offside={offside}>
      <Tab
        onClick={toggle}
        // onMouseEnter={playHoverSound}
      >
        <IconPadding>
          <MenuIcon fontSize="large" />
        </IconPadding>
        {/* {notification ? <NotificationDot top="2px" right="2px" /> : null} */}
      </Tab>
      <MenuTabs>
        <MenuTab
          onClick={
            // withClickSound(
              () => setActiveTab('topics')
            // )
          }
          // onMouseEnter={playHoverSound}
          active={activeTab === 'topics'}
          top="6px"
        >
          <ChatIcon fontSize="large" />
        </MenuTab>
        <MenuTab
          onClick={
            // withClickSound(
              () => setActiveTab('items')
            // )
          }
          // onMouseEnter={playHoverSound}
          active={activeTab === 'items'}
        >
          <BusinessCenterIcon fontSize="large" />
        </MenuTab>
        <MenuTab
          onClick={
            // withClickSound(
              () => setActiveTab('skills')
            // )
          }
          // onMouseEnter={playHoverSound}
          active={activeTab === 'skills'}
        >
          <AccessibilityNewIcon fontSize="large" />
        </MenuTab>
      </MenuTabs>
      <Listing>
        {listing}
      </Listing>
      <Info visible={text}>
        {text && <Line />}
        <ReactMarkdown components={components} disallowedElements={disallowed}>
          {`### ${title}\n\n${text}`}
        </ReactMarkdown>
      </Info>
    </Drawer>
  );
};

export default MenuDrawer;
