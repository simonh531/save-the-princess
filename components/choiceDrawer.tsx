import { FC } from 'react';
import styled from 'styled-components';

const Drawer = styled.div<{ visible: number }>`
  display: flex;
  flex-direction: column;
  border-radius: 4px;
  height: 200px;
  position: absolute;
  bottom: 0;
  background-color: white;
  pointer-events: ${(props) => (props.visible ? 'auto' : 'none')};
  right: ${(props) => (props.visible ? '0' : '-20px')};
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

const choiceDrawer: FC<{
  actions: {name: string, action: () => void}[]
}> = ({ actions }) => (
  <Drawer visible={actions.length}>
    {actions.map((action) => (
      <Choice onClick={action.action}>
        {action.name}
      </Choice>
    ))}
  </Drawer>
);

export default choiceDrawer;
