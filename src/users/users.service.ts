import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const newUser = new User();
    newUser.userName = createUserDto.userName;
    newUser.ETHAddress = createUserDto.ETHAddress;

    // Check if username already exists in the database
    const existingUser = await this.usersRepository.findOneBy({
      userName: newUser.userName,
    });

    if (existingUser) {
      throw new ConflictException('Username must be unique.');
    }

    return this.usersRepository.save(newUser);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  findOne(userName: string): Promise<User> {
    return this.usersRepository.findOneBy({ userName: userName });
  }

  async remove(userName: string): Promise<void> {
    await this.usersRepository.delete(userName);
  }
}
