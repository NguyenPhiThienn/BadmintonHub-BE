import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type VenueDocument = Venue & Document;

export enum VenueStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

@Schema({ timestamps: true })
export class Venue {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  owner_id: User;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  address: string;

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      required: false,
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: false,
    },
  })
  coordinates: any;

  @Prop()
  description: string;

  @Prop({ required: true })
  open_time: string; // Format HH:mm

  @Prop({ required: true })
  close_time: string; // Format HH:mm

  @Prop({ default: 0 })
  average_rating: number;

  @Prop({ required: true, enum: VenueStatus, default: VenueStatus.ACTIVE })
  status: VenueStatus;
}

export const VenueSchema = SchemaFactory.createForClass(Venue);
VenueSchema.index({ coordinates: '2dsphere' });
