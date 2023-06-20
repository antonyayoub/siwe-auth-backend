import { Injectable } from '@nestjs/common';
import { generateNonce, SiweMessage } from 'siwe';

@Injectable()
export class SiweService {
  getNonce() {
    return generateNonce();
  }

  async verifyMessage(message: string, signature: string, nonce: string) {
    const siweMessage = new SiweMessage(message);

    const { data: originalMessage } = await siweMessage.verify({
      signature: signature,
      nonce: nonce,
    });

    return originalMessage;
  }
}
