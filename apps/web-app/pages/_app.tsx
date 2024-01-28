import { AppProps } from 'next/app';
import Head from 'next/head';
import './styles.css';

import { SessionProvider } from 'next-auth/react';

import AppWrapper from '../layout/app-wrapper';

import { api } from '../utils/api';


function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  return (
    <SessionProvider session={session}>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.svg" />
        <title>Delivert</title>
      </Head>
      <AppWrapper>
        <Component {...pageProps} />
      </AppWrapper>
    </SessionProvider>
  );
}

export default api.withTRPC(App);
