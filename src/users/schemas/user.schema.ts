import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  ADMIN = 'ADMIN',
  COURT_OWNER = 'COURT_OWNER',
  PLAYER = 'PLAYER',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  full_name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, unique: true })
  phone: string;

  @Prop({ required: true, enum: UserRole, default: UserRole.PLAYER })
  role: UserRole;

  @Prop({ required: true })
  password_hash: string;

  @Prop()
  avatar_url: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
