import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export const STATUSES = ['TO_APPLY', 'SENT', 'INTERVIEW', 'OFFER', 'REJECTED'] as const;
export type Status = (typeof STATUSES)[number];

@Schema({ timestamps: true })
export class Application {
  @Prop({ required: true, index: true })
  ownerUid: string;

  @Prop({ required: true, trim: true })
  company: string;

  @Prop({ required: true, trim: true })
  position: string;

  @Prop({ type: String })
  offerUrl?: string | null;

  @Prop({ type: String, enum: STATUSES, default: 'TO_APPLY' })
  status: Status;

  @Prop({ type: Date })
  appliedAt?: Date | null;

  @Prop({ type: String })
  notes?: string | null;
}

export const ApplicationSchema = SchemaFactory.createForClass(Application);