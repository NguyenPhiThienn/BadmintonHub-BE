import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Venue } from '../../venues/schemas/venue.schema';
import { User } from '../../users/schemas/user.schema';

export type ReviewDocument = Review & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Review {
  @Prop({ type: Types.ObjectId, ref: 'Venue', required: true })
  venue_id: Venue;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  player_id: User;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number; // 1 to 5 stars

  @Prop()
  comment: string;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);
