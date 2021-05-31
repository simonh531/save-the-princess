import { FC } from 'react';
import '../styles/globals.css';
import type { AppProps } from 'next/app';
// eslint-disable-next-line import/no-extraneous-dependencies
import { ApolloProvider } from '@apollo/client/react';
import { ApolloClient, InMemoryCache } from '@apollo/client';
import {
  dialogueId, focusId, locationId, topics, items, time,
} from '../data/state';
import { checks } from '../data/checks';

const client = new ApolloClient({
  uri: '/api/graphql',
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          dialogueId: {
            read() {
              return dialogueId();
            },
          },
          focusId: {
            read() {
              return focusId();
            },
          },
          locationId: {
            read() {
              return locationId();
            },
          },
          topics: {
            read() {
              return topics();
            },
          },
          items: {
            read() {
              return items();
            },
          },
          time: {
            read() {
              return time();
            },
          },
          checks: {
            read() {
              return checks();
            },
          },
        },
      },
    },
  }),
});

const App: FC<AppProps> = ({ Component, pageProps }) => (
  <ApolloProvider client={client}>
    {/* eslint-disable-next-line react/jsx-props-no-spreading */}
    <Component {...pageProps} />
  </ApolloProvider>
);
export default App;
