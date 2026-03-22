import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Venue } from '../../venues/schemas/venue.schema';

export type PromotionDocument = Promotion & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Promotion {
  @Prop({ type: Types.ObjectId, ref: 'Venue', required: false })
  venue_id: Venue; // Nullable if system-wide promotion

  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ required: true })
  discount_percentage: number;

  @Prop()
  max_discount_amount: number;

  @Prop({ required: true })
  start_date: Date;

  @Prop({ required: true })
  end_date: Date;

  @Prop({ default: true })
  is_active: boolean;
}

export const PromotionSchema = SchemaFactory.createForClass(Promotion);
