import {
  Body,
  ConflictException,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ethers } from 'ethers';
import { QueryFailedError } from 'typeorm';

import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';
import { AuthService } from 'src/auth/auth.service';
import { SiweService } from 'src/siwe/siwe.service';

@Controller('user')
export class UsersController {
  constructor(
    private readonly userService: UsersService,
    private readonly authService: AuthService,
    private readonly siweService: SiweService,
  ) {}

  @Post('/signup')
  async signup(
    @Body('userName') userName: string,
    @Body('ethAddress') ethAddress: string,
    @Body('message') message: string,
    @Body('signature') signature: string,
    @Body('nonce') nonce: string,
  ) {
    if (!userName || !ethAddress || !message || !signature || !nonce) {
      throw new HttpException(
        'Missing required information',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    try {
      await this.siweService.verifyMessage(message, signature, nonce);

      const newUserDto: CreateUserDto = {
        userName: userName,
        ethAddress: ethers.getAddress(ethAddress),
      };

      const newUser = await this.userService.create(newUserDto);

      const accessToken = (await this.authService.generateToken(newUser))
        .access_token;

      return {
        accessToken,
      };
    } catch (e) {
      if (e instanceof QueryFailedError) {
        throw new HttpException('user already exist', HttpStatus.CONFLICT);
      }
      if (e instanceof ConflictException) {
        throw new HttpException('username already exist', HttpStatus.CONFLICT);
      }
      throw new HttpException(
        'internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/signin')
  async signin(
    @Body('ethAddress') ethAddress: string,
    @Body('message') message: string,
    @Body('signature') signature: string,
    @Body('nonce') nonce: string,
  ) {
    if (!ethAddress || !message || !signature || !nonce) {
      throw new HttpException(
        'Missing required information',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    try {
      await this.siweService.verifyMessage(message, signature, nonce);

      const user = await this.userService.findOneByEthAddress(ethAddress);

      if (!user) {
        throw new HttpException('user not found', HttpStatus.NOT_FOUND);
      }

      const accessToken = (await this.authService.generateToken(user))
        .access_token;

      return {
        accessToken,
      };
    } catch (e) {
      throw new HttpException(
        'internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  @Get('/profile/:ethAddress')
  async profile(@Req() req: Request, @Param('ethAddress') ethAddress: string) {
    if (!req.headers.authorization) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    const token = req.headers.authorization.split(' ')[1];
    const user = await this.authService.validateUser(ethAddress, token);
    if (!user) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    return { user };
  }
}
