import { appRouter } from '../../server/api/root';
import { NextApiHandler } from 'next';
import { createOpenApiNextHandler } from 'trpc-openapi';
import cors from 'nextjs-cors'

import { env } from '../../env.mjs';
import { createTRPCContext } from '../../server/api/trpc';

const handler: NextApiHandler = async (req, res) => {
  await cors(req, res, {
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    origin: '*',
    optionsSuccessStatus: 200,
  });

  return createOpenApiNextHandler({
    router: appRouter,
    createContext: createTRPCContext,
    onError:
      env.NODE_ENV === 'development'
        ? ({ path, error }) => {
            console.error(
              `❌ [openapi] tRPC failed on ${path ?? '<no-path>'}: ${error.message}`
            );
          }
        : undefined,
  })(req, res);
};

export default handler;