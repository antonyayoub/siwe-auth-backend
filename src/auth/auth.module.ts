import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { User } from 'src/users/user.entity';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { AuthController } from './auth.controller';
import { SiweService } from 'src/siwe/siwe.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    ConfigModule,
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN },
    }),
  ],
  providers: [AuthService, SiweService, JwtService, UsersService],
  exports: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
