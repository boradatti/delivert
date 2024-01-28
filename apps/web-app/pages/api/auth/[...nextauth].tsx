import NextAuth from 'next-auth/next';

import { authOptions } from 'apps/web-app/server/auth/options';

export default NextAuth(authOptions);
