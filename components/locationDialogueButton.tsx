import { FC, useState, useRef } from 'react';
import styled from 'styled-components';
import { gql, useQuery } from '@apollo/client';
import RoomIcon from '@material-ui/icons/Room';
import { useMouseAndWindowSizeEffect, useThemeSounds } from '../utils/hooks';
import { setDialogue } from '../data/state';

const DIALOGUE_LOCATION = gql`
  query GetGameState {
    dialogueId,
    locationId,
  }
`;

const LocationDialogueButton = styled.div<{visible: boolean}>`
  height: 60px;
  width: 60px;
  position: absolute;
  left: calc(50% - 30px);
  bottom: calc(12.5% - 30px);
  background-color: white;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
  pointer-events: ${(props) => (props.visible ? 'auto' : 'none')};
  opacity: ${(props) => (props.visible ? '0.8' : '0')};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s;
  font-size: 2.8em;

  :hover {
    background-color: ${(props) => props.theme.backgroundColor};
    color: ${(props) => props.theme.color};
  }
`;

const locationDialogueButton:FC = () => {
  const { loading, /* error, */ data } = useQuery(DIALOGUE_LOCATION);
  const { dialogueId, locationId } = data;
  const [near, setNear] = useState(false);
  const button = useRef<HTMLDivElement | null>(null);
  const { playHoverSound, withClickSound } = useThemeSounds();
  useMouseAndWindowSizeEffect((mouseX, mouseY, screenX, screenY) => {
    if (button.current && mouseX !== undefined && mouseY !== undefined && screenX && screenY) {
      const mouseXRatio = (mouseX / screenX - 0.5) / 0.5;
      const mouseYRatio = mouseY / screenY;
      // focus and directrix parabola
      if (mouseYRatio > 2 * mouseXRatio * mouseXRatio + 0.75) {
        setNear(true);
      } else {
        setNear(false);
      }
    }
  }, []);

  if (loading || !data) {
    return null;
  }

  return (
    <LocationDialogueButton
      visible={!dialogueId && near}
      onClick={withClickSound(() => setDialogue(`locations/${locationId}`))}
      onMouseEnter={playHoverSound}
      ref={button}
    >
      <RoomIcon fontSize="inherit" />
    </LocationDialogueButton>
  );
};

export default locationDialogueButton;
