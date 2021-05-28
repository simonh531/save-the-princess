import Head from 'next/head';
import Link from 'next/link';
import { useQuery, gql } from '@apollo/client';

const GAME_STATE = gql`
  query GetGameState {
    gameState
  }
`;

export default function Home() {
  const { loading, error, data } = useQuery(GAME_STATE);
  console.log(data);
  return (
    <div>
      <Head>
        <title>Save the Princess demo</title>
        <meta name="description" content="Play Save the Princess" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Link href="/game">
        <a>Play the demo</a>
      </Link>
    </div>
  );
}
