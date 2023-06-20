import { Controller, Get } from '@nestjs/common';
import { SiweService } from 'src/siwe/siwe.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly siweService: SiweService) {}

  @Get('siwe/nonce')
  async getNonce() {
    const nonce = this.siweService.getNonce();
    return nonce;
  }
}
