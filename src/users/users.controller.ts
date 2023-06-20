import {
  ConflictException,
  Controller,
  Get,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { UsersService } from './users.service';
import { ethers } from 'ethers';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthService } from 'src/auth/auth.service';
import { QueryFailedError } from 'typeorm';
import { SiweService } from 'src/siwe/siwe.service';

@Controller('user')
export class UsersController {
  constructor(
    private readonly userService: UsersService,
    private readonly authService: AuthService,
    private readonly siweService: SiweService,
  ) {}

  @Post('/signup')
  async signup(@Req() req: Request, @Res() res: Response) {
    if (
      !req.body.userName ||
      !req.body.ethAddress ||
      !req.body.message ||
      !req.body.signature ||
      !req.body.nonce
    ) {
      return res.status(422).send('Missing required information');
    }

    try {
      await this.siweService.verifyMessage(
        req.body.message,
        req.body.signature,
        req.body.nonce,
      );

      const newUserDto: CreateUserDto = {
        userName: req.body.userName,
        ethAddress: ethers.getAddress(req.body.ethAddress),
      };

      const newUser = await this.userService.create(newUserDto);

      const accessToken = (await this.authService.generateToken(newUser))
        .access_token;

      res.status(200).json({
        accessToken,
      });
    } catch (e) {
      if (e instanceof QueryFailedError) {
        return res.status(500).json({
          message: 'user already exist',
        });
      }
      if (e instanceof ConflictException) {
        return res.status(500).json({
          message: 'username already exist',
        });
      }
      return res.status(500).json({
        message: 'internal server error',
      });
    }
  }

  @Post('/signin')
  async signin(@Req() req: Request, @Res() res: Response) {
    if (
      !req.body.ethAddress ||
      !req.body.message ||
      !req.body.signature ||
      !req.body.nonce
    ) {
      return res.status(422).send('Missing required information');
    }

    try {
      await this.siweService.verifyMessage(
        req.body.message,
        req.body.signature,
        req.body.nonce,
      );

      const user = await this.userService.findOneByEthAddress(
        req.body.ethAddress,
      );

      if (!user) {
        return res.status(404).json({
          message: 'user not found',
        });
      }

      const accessToken = (await this.authService.generateToken(user))
        .access_token;

      res.status(200).json({
        accessToken,
      });
    } catch (e) {
      return res.status(500).json({
        message: 'internal server error',
      });
    }
  }
  @Get('/profile/:ethAddress')
  async profile(@Req() req: Request, @Res() res: Response) {
    if (!req.headers.authorization) {
      return res.status(401).json({
        message: 'unauthorized',
      });
    }
    const token = req.headers.authorization.split(' ')[1];
    const user = await this.authService.validateUser(
      req.params.ethAddress,
      token,
    );
    if (!user) {
      return res.status(401).json({
        message: 'unauthorized',
      });
    }
    return res.status(200).json({
      user,
    });
  }
}
