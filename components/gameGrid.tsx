import { FC, ReactNode } from 'react';
import styled from 'styled-components';

const Grid = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  overflow: hidden;
  padding: 20px;
  pointer-events: none;
  display: grid;
  column-gap: 8px;
  grid-template-columns: 1fr 600px 1fr;
  grid-template-rows: auto 200px;
  grid-template-areas:
    "topics top items"
    "topics dialogueBox items";
`;

interface Props {
  children: ReactNode,
}

const GameGrid: FC<Props> = ({ children }:Props) => (
  <Grid>
    {children}
  </Grid>
);

export default GameGrid;
