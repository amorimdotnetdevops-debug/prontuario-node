// src/modules/auth/infrastructure/database/refresh-token.schema.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('refresh_tokens')
@Index(['userId', 'isRevoked'])
export class RefreshTokenSchema {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar')
  userId: string;

  @Column('text')
  token: string;

  @Column('datetime')
  expiresAt: Date;

  @Column('boolean', { default: false })
  isRevoked: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @Column('varchar', { nullable: true })
  deviceId?: string;

  @Column('varchar', { nullable: true })
  ipAddress?: string;
}
