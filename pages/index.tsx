import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
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
