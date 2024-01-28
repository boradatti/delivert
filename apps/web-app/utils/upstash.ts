import { Receiver } from '@upstash/qstash'
import type { ReceiverConfig, VerifyRequest } from '@upstash/qstash/types/pkg/receiver'

const QSTASH_RECEIVER_CONFIG: Omit<ReceiverConfig, 'subtleCrypto'> = {
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
}

export async function verifySignature(options: VerifyRequest) {
  const r = new Receiver(QSTASH_RECEIVER_CONFIG);

  let valid = false;
  let message = '';

  try {
    valid = await r.verify(options);
  } catch (err) {
    // @ts-ignore
    message = err.message;
  }

  return {
    valid,
    message
  }
}
