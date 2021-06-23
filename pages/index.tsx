import Head from 'next/head';
import Link from 'next/link';
import { FC } from 'react';

const Home:FC = () => (
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

export default Home;
