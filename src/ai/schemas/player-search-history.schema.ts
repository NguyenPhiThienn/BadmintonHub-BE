import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type PlayerSearchHistoryDocument = PlayerSearchHistory & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class PlayerSearchHistory {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  player_id: User;

  @Prop()
  searched_address: string;

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      required: false,
    },
    searched_coordinates: {
      type: [Number], // [longitude, latitude]
      required: false,
    },
  })
  searched_coordinates: any;
}

export const PlayerSearchHistorySchema = SchemaFactory.createForClass(PlayerSearchHistory);
PlayerSearchHistorySchema.index({ searched_coordinates: '2dsphere' });
