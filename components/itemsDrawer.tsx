import { FC, useEffect, useState } from 'react';
import styled from 'styled-components';
import BusinessCenterIcon from '@material-ui/icons/BusinessCenter';
import { gql, useQuery } from '@apollo/client';
import { setDialogue } from '../data/state';
import { Dialogue, Item } from '../utils/interfaces';
import NotificationDot from './notificationDot';
import * as Items from '../items';
import Dialogues from '../dialogue';

const itemList:Record<string, Item> = Items;

const ITEMS = gql`
  query GetItems {
    dialogueId
    items
  }
`;

const Drawer = styled.div<{ offside: boolean, visible: number }>`
  grid-area: items;
  display: flex;
  flex-direction: column;
  border-radius: 0 4px 4px 4px;
  padding: 10px 30px;
  pointer-events: auto;
  background-color: white;
  position: relative;
  left: ${(props) => (props.offside ? 'calc(100% + 20px)' : '0')};
  opacity: ${(props) => (props.visible ? '0.95' : '0')};

  transition: 0.4s left, 0.4s opacity;
`;

const Tab = styled.div`
  position: absolute;
  top: 0;
  right: 100%;
  width: 44px;
  padding-left: 4px;
  height: 48px;
  border-radius: 50% 0 0  50%;
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

function ItemListing({ name, useItem }:{ name: string, useItem: () => void }) {
  return (
    <Listing onClick={useItem}>
      {name}
    </Listing>
  );
}

const makeUseItem = (dialogueId: string, id: string) => {
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
        if (dialogue.item && dialogue.item[id]) {
          action = dialogue.item[id];
        } else {
          action = () => setDialogue(`items/${id}`);
        }
      }
    }
  }
  return action;
};

const ItemsDrawer: FC = () => {
  const { loading, /* error, */ data } = useQuery(ITEMS);
  const [offside, setOffside] = useState(true);
  const [notification, setNotification] = useState(false);
  const toggle = () => {
    setOffside(!offside);
    setNotification(false);
  };
  const { items, dialogueId }: {items: string[], dialogueId: string} = data;

  // basically enable the pulse when an item is added
  useEffect(() => setNotification(true), [items.length]);

  if (loading || !data) {
    return null;
  }

  return (
    <Drawer offside={offside} visible={items.length}>
      <Tab onClick={toggle}>
        <BusinessCenterIcon fontSize="large" />
        {notification ? <NotificationDot top="6px" left="4px" /> : null}
      </Tab>
      {items.map((itemId) => (
        <ItemListing
          key={itemId}
          name={itemList[itemId].name}
          useItem={makeUseItem(dialogueId, itemId)}
        />
      ))}
    </Drawer>
  );
};

export default ItemsDrawer;
