import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryColumn({ unique: true })
  userName: string;

  @Column()
  ETHAddress: string;
}
