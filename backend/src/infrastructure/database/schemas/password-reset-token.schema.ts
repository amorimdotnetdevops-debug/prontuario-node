import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('password_reset_tokens')
export class PasswordResetTokenSchema {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar')
  userId: string;

  @Column('text')
  token: string;

  @Column('datetime')
  expiresAt: Date;

  @Column('boolean', { default: false })
  isUsed: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @Column('datetime', { nullable: true })
  usedAt?: Date;
}
