import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Venue } from '../../venues/schemas/venue.schema';

export type RecurringBookingDocument = RecurringBooking & Document;

export enum RecurringType {
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
  MONTHLY = 'MONTHLY',
}

export enum RecurringStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export enum PaymentScheduleType {
  FULL = 'FULL',        // Pay all at once
  MONTHLY = 'MONTHLY',  // Pay per month
}

@Schema({ timestamps: true })
export class RecurringBooking {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  playerId: User;

  @Prop({ type: Types.ObjectId, ref: 'Venue', required: true })
  venueId: Venue;

  @Prop({ type: Types.ObjectId, ref: 'Court', required: true })
  courtId: any;

  @Prop({ required: true, enum: RecurringType })
  type: RecurringType;

  @Prop({ required: true })
  occurrences: number;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ required: true })
  startTime: string;

  @Prop({ required: true })
  endTime: string;

  @Prop({ required: true, enum: PaymentScheduleType })
  paymentSchedule: PaymentScheduleType;

  @Prop({ required: true })
  totalAmount: number;

  @Prop({ required: true })
  totalPerOccurrence: number;

  @Prop({ type: Types.ObjectId, ref: 'Coupon', required: false })
  couponId: any;

  @Prop({ required: false })
  customerName: string;

  @Prop({ required: false })
  customerPhone: string;

  @Prop({ required: false })
  customerEmail: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ required: true, enum: RecurringStatus, default: RecurringStatus.ACTIVE })
  status: RecurringStatus;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Booking' }] })
  bookingIds: Types.ObjectId[];

  @Prop({ type: Object })
  metadata: {
    dayOfWeek: number;
    note?: string;
  };
}

export const RecurringBookingSchema = SchemaFactory.createForClass(RecurringBooking);

// Index for efficient queries
RecurringBookingSchema.index({ playerId: 1, status: 1 });
RecurringBookingSchema.index({ venueId: 1 });
RecurringBookingSchema.index({ startDate: 1, endDate: 1 });
