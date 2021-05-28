import styled, { keyframes } from 'styled-components';

const pulse = keyframes`
  from {
    filter: drop-shadow(0 0 0 rgba(30, 144, 255, 1));
  }

  to {
    filter: drop-shadow(0 0 8px rgba(30, 144, 255, 0));
  }
`;

const NotificationDot = styled.div<{top: string, right?: string, left?: string}>`
  position: absolute;
  width: 14px;
  height: 14px;
  background-color: dodgerblue;
  border-radius: 50%;
  top: ${(props) => props.top};
  right: ${(props) => props.right};
  left: ${(props) => props.left};
  animation: ${pulse} 1s ease-out infinite;
`;

export default NotificationDot;
