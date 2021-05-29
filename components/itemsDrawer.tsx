import { FC, useEffect, useState } from 'react';
import styled from 'styled-components';
import BusinessCenterIcon from '@material-ui/icons/BusinessCenter';
import { setDialogue } from '../data/state';
import { Item, ItemList } from '../utils/interfaces';
import NotificationDot from './notificationDot';
import * as Items from '../items';

const itemList:ItemList = Items;

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

function ItemListing({
  id, item, focus, useItem,
}:{
  // buggy
  // eslint-disable-next-line no-unused-vars
  id: string, item: Item, focus: string, useItem: (itemId: string) => void
}) {
  const click = () => {
    if (!focus) {
      setDialogue(`items/${id}`);
    } else {
      useItem(id);
    }
  };
  return (
    <Listing onClick={click}>
      {item.name}
    </Listing>
  );
}

interface Props {
  items: Array<string>
  focus: string
  useItem: () => void
}
const ItemsDrawer: FC<Props> = ({ items, focus, useItem }) => {
  const [offside, setOffside] = useState(true);
  const [notification, setNotification] = useState(false);
  const toggle = () => {
    setOffside(!offside);
    setNotification(false);
  };

  // basically enable the pulse when an item is added
  useEffect(() => setNotification(true), [items.length]);

  return (
    <Drawer offside={offside} visible={items.length}>
      <Tab onClick={toggle}>
        <BusinessCenterIcon fontSize="large" />
        {notification ? <NotificationDot top="6px" left="4px" /> : null}
      </Tab>
      {items.map((itemId) => (
        <ItemListing
          key={itemId}
          id={itemId}
          item={itemList[itemId]}
          focus={focus}
          useItem={useItem}
        />
      ))}
    </Drawer>
  );
};

export default ItemsDrawer;
