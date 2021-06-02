import { FC, useEffect, useState } from 'react';
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

const MenuTabs = styled.div`
  padding: 6px 0;
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

const Listing = styled.div<{active?: boolean}>`
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

const MenuDrawer: FC<{
  // eslint-disable-next-line no-unused-vars
  setInfoId: (text: string) => void,
  close: () => void,
  infoId: string
}> = ({ setInfoId, close, infoId }) => {
  const { loading, /* error, */ data } = useQuery(USABLES);
  const [offside, setOffside] = useState(true);
  const [activeTab, setActiveTab] = useState('topics');
  // const [notification, setNotification] = useState(false);
  const toggle = () => {
    if (!offside) {
      close();
    }
    setOffside(!offside);
    // setNotification(false);
  };
  const { topics, items, checks } = data;

  useEffect(close, [activeTab]); // close info when tab switches

  // basically enable the pulse when a topic is added
  // useEffect(() => setNotification(true), [topics.length]);

  let listing = [];
  if (activeTab === 'topics') {
    listing = topics.map((id: string) => (
      <Listing key={id} onClick={() => setInfoId(`topic/${id}`)} active={infoId === `topic/${id}`}>
        {Topics[id].name}
      </Listing>
    ));
  } else if (activeTab === 'items') {
    listing = items.map((item: StateItem) => (
      <Listing key={item.id} onClick={() => setInfoId(`item/${item.id}`)} active={infoId === `item/${item.id}`}>
        {Items[item.id].name}
        {item.quantity > 1 ? ` × ${item.quantity}` : ''}
      </Listing>
    ));
  } else if (activeTab === 'skills') {
    const baseSkills = characterStats[checks.identity];
    const calculatedStats = calcStats(baseSkills, checks);
    Object.entries(calculatedStats).forEach(([id, level]) => {
      if (level) {
        listing.push(
          <Listing key={id}>
            {Skills[id].name}
            :
            {' '}
            {levelName[level - 1]}
          </Listing>,
        );
      }
    });
  }

  useEffect(() => { // handle keyboard
    function handleKeydown(event:KeyboardEvent) {
      // console.log(event);
      switch (event.code) {
        case 'KeyT':
          if (!offside && activeTab === 'topics') {
            close();
            setOffside(true);
          } else {
            setActiveTab('topics');
            setOffside(false);
          }
          break;
        case 'KeyI':
          if (!offside && activeTab === 'items') {
            close();
            setOffside(true);
          } else {
            setActiveTab('items');
            setOffside(false);
          }
          break;
        case 'KeyS':
          if (!offside && activeTab === 'skills') {
            close();
            setOffside(true);
          } else {
            setActiveTab('skills');
            setOffside(false);
          }
          break;
        default:
          break;
      }
    }
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [offside, activeTab]);

  if (loading || !data) {
    return null;
  }

  return (
    <Drawer offside={offside}>
      <Tab onClick={toggle}>
        <MenuIcon fontSize="large" />
        {/* {notification ? <NotificationDot top="2px" right="2px" /> : null} */}
      </Tab>
      <MenuTabs>
        <MenuTab
          onClick={() => setActiveTab('topics')}
          active={activeTab === 'topics'}
          top="6px"
        >
          <ChatIcon fontSize="large" />
        </MenuTab>
        <MenuTab
          onClick={() => setActiveTab('items')}
          active={activeTab === 'items'}
        >
          <BusinessCenterIcon fontSize="large" />
        </MenuTab>
        <MenuTab
          onClick={() => setActiveTab('skills')}
          active={activeTab === 'skills'}
        >
          <AccessibilityNewIcon fontSize="large" />
        </MenuTab>
      </MenuTabs>
      {listing}
    </Drawer>
  );
};

export default MenuDrawer;
