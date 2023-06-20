import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from './constants';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(ethAddress: string, accessToken: string): Promise<any> {
    const payload = this.jwtService.verify(accessToken, {
      secret: jwtConstants.secret,
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
    const payload = { username: user.username, ethAddress: user.ethAddress };
    return {
      access_token: this.jwtService.sign(payload, {
        secret: jwtConstants.secret,
      }),
    };
  }
}
