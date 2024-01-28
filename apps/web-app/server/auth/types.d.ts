import { DefaultSession } from 'next-auth';
// import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: { id: string } & DefaultSession['user'];
  }
}

// not using JWT, but here's how to extend it:
// declare module "next-auth/jwt" {
//   interface JWT {
//     accessToken: string;
//     accessTokenExpires: number;
//     refreshToken?: string;
//     error?: string;
//   }
// }