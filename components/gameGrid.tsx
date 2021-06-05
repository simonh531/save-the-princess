import { FC, ReactNode } from 'react';
import styled, { ThemeProvider } from 'styled-components';
import { gql, useQuery } from '@apollo/client';
import Themes from '../styles/characterThemes';

const CHECKS = gql`
  query GetChecks {
    checks
  }
`;

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
  grid-template-columns: 1fr 60% 1fr;
  grid-template-rows: auto 200px;
  grid-template-areas:
    "left top rightTop"
    "left dialogueBox rightBottom";
`;

const GameGrid: FC<{children: ReactNode}> = ({ children }) => {
  const { loading, /* error, */ data } = useQuery(CHECKS);
  const { checks }:{ checks:Record<string, string> } = data;

  if (loading || !data) {
    return null;
  }

  return (
    <Grid>
      <ThemeProvider theme={Themes[checks.identity]}>
        {children}
      </ThemeProvider>
    </Grid>
  );
};

export default GameGrid;
