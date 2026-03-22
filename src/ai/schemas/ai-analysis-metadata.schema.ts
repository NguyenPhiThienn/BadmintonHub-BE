import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Venue } from '../../venues/schemas/venue.schema';

export type AIAnalysisMetadataDocument = AIAnalysisMetadata & Document;

@Schema({ timestamps: { createdAt: false, updatedAt: false } })
export class AIAnalysisMetadata {
  @Prop({ type: Types.ObjectId, ref: 'Venue', required: true })
  venue_id: Venue;

  @Prop({ type: Object, default: {} })
  peak_hours_prediction: any; // JSON lưu trữ dự đoán các khung giờ hot

  @Prop({ default: Date.now })
  last_analyzed_at: Date;
}

export const AIAnalysisMetadataSchema = SchemaFactory.createForClass(AIAnalysisMetadata);
