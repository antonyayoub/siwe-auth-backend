import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(ethAddress: string, accessToken: string): Promise<any> {
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    const payload = this.jwtService.verify(accessToken, {
      secret: jwtSecret,
    });
    if (payload.ethAddress !== ethAddress) {
      return null;
    }
    const user = await this.usersService.findOneByEthAddress(ethAddress);
    if (user) {
      return user;
    }
    return null;
  }

  async generateToken(user: any) {
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    const payload = { username: user.username, ethAddress: user.ethAddress };
    return {
      access_token: this.jwtService.sign(payload, {
        secret: jwtSecret,
      }),
    };
  }
}
