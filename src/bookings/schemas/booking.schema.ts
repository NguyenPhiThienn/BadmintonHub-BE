import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Venue } from '../../venues/schemas/venue.schema';
import { Promotion } from '../../promotions/schemas/promotion.schema';

export type BookingDocument = Booking & Document;

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

@Schema({ timestamps: true })
export class Booking {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  player_id: User;

  @Prop({ type: Types.ObjectId, ref: 'Venue', required: true })
  venue_id: Venue;

  @Prop({ type: Types.ObjectId, ref: 'Promotion', required: false })
  promotion_id: Promotion;

  @Prop({ required: true })
  total_price: number;

  @Prop({ required: true })
  final_price: number;

  @Prop({ required: true, enum: BookingStatus, default: BookingStatus.PENDING })
  status: BookingStatus;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);
