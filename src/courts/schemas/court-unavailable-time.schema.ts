import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Court } from './court.schema';

export type CourtUnavailableTimeDocument = CourtUnavailableTime & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class CourtUnavailableTime {
  @Prop({ type: Types.ObjectId, ref: 'Court', required: true })
  court_id: Court;

  @Prop({ required: true })
  start_datetime: Date;

  @Prop({ required: true })
  end_datetime: Date;

  @Prop()
  reason: string;
}

export const CourtUnavailableTimeSchema = SchemaFactory.createForClass(CourtUnavailableTime);
