
import { Inter, Roboto } from 'next/font/google';
import localFont from 'next/font/local';
import clsx from 'clsx';

import { useSession, signOut } from 'next-auth/react';
import { FC, ReactNode } from 'react';

import { Layout } from '@deliverdaniel/ui';

const inter = Inter({
  weight: ['400', '700'],
  style: ['normal'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const roboto = Roboto({
  weight: ['400', '700'],
  style: ['normal'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
});

const gotham = localFont({
  src: [
    {
      path: '../public/fonts/GothamBold.ttf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../public/fonts/GothamMedium.ttf',
      weight: '400',
      style: 'normal',
    },
  ],
  display: 'swap',
  variable: '--font-gotham',
});

const AppWrapper: FC<{ children: ReactNode }> = ({ children }) => {
  const { data } = useSession();

  return (
    <>
      <Layout
        user={
          data?.user
            ? { name: data.user.name!, image: data.user.image! }
            : undefined
        }
        onSignOut={signOut}
        className={clsx(inter.variable, roboto.variable)}
      >
        {children}
      </Layout>
    </>
  );
};

export default AppWrapper;