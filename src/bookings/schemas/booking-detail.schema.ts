import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Booking } from './booking.schema';
import { Court } from '../../courts/schemas/court.schema';

export type BookingDetailDocument = BookingDetail & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class BookingDetail {
  @Prop({ type: Types.ObjectId, ref: 'Booking', required: true })
  booking_id: Booking;

  @Prop({ type: Types.ObjectId, ref: 'Court', required: true })
  court_id: Court;

  @Prop({ required: true })
  booking_date: Date; // Keep as date part

  @Prop({ required: true })
  start_time: string; // Format HH:mm

  @Prop({ required: true })
  end_time: string; // Format HH:mm

  @Prop({ required: true })
  price: number; // Price of this specific slot
}

export const BookingDetailSchema = SchemaFactory.createForClass(BookingDetail);
