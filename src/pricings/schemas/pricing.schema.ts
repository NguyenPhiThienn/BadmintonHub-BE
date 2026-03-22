import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Venue } from '../../venues/schemas/venue.schema';

export type PricingDocument = Pricing & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Pricing {
  @Prop({ type: Types.ObjectId, ref: 'Venue', required: true })
  venue_id: Venue;

  @Prop({ required: false })
  day_of_week: number; // 0-6 cho thứ 2 đến CN, NULL cho ngày đặc biệt/lễ

  @Prop({ required: true })
  start_time: string; // Format HH:mm

  @Prop({ required: true })
  end_time: string; // Format HH:mm

  @Prop({ required: true })
  price_per_hour: number;
}

export const PricingSchema = SchemaFactory.createForClass(Pricing);
