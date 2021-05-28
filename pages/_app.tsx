import '../styles/globals.css';
import type { AppProps } from 'next/app';
// eslint-disable-next-line import/no-extraneous-dependencies
import { ApolloProvider } from '@apollo/client/react';
import { ApolloClient, InMemoryCache } from '@apollo/client';
import {
  dialogue, focus, location, topics, items,
} from '../data/state';

const client = new ApolloClient({
  uri: '/api/graphql',
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          dialogue: {
            read() {
              return dialogue();
            },
          },
          focus: {
            read() {
              return focus();
            },
          },
          location: {
            read() {
              return location();
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
        },
      },
    },
  }),
});

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ApolloProvider client={client}>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <Component {...pageProps} />
    </ApolloProvider>
  );
}
export default MyApp;
