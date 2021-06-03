import { FC } from 'react';
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';
import Topics from '../data/topics';
import Items from '../data/items';
import { getText, getAction } from '../utils/getters';

const Drawer = styled.div<{ visible: boolean, choiceVisible: number }>`
  height: ${(props) => (props.choiceVisible ? 'calc(100% - 208px)' : '100%')};
  display: flex;
  flex-direction: column;
  border-radius: 4px;
  padding: 10px 30px;
  pointer-events: ${(props) => (props.visible ? 'auto' : 'none')};
  background-color: white;
  position: relative;
  left: ${(props) => (props.visible ? '0' : '20px')};
  opacity: ${(props) => (props.visible ? '0.95' : '0')};
  font-size: 1.2em;
  filter: drop-shadow(0 0 2px rgba(0,0,0,0.2));

  transition: 0.4s left, 0.4s opacity, 0.4s height;
`;

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

const InfoDrawer: FC<{
  infoId: string,
  visible: boolean,
  choiceVisible: number,
}> = ({ infoId, visible, choiceVisible }) => {
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
        <ActionText onClick={getAction(actionList[parseInt(href, 10)])}>
          {children}
        </ActionText>
      );
    },
    h3: H3,
  };

  return (
    <Drawer visible={visible} choiceVisible={choiceVisible}>
      <ReactMarkdown components={components} disallowedElements={disallowed}>
        {`### ${title}\n\n${text}`}
      </ReactMarkdown>
    </Drawer>
  );
};

export default InfoDrawer;
