import mongoose, { Schema, Document } from 'mongoose';

export interface IResponseBody extends Document {
  historyId: string;
  headers: Array<{ key: string; value: string }>;
  body: any;
  cookies: any[];
  size: number;
  createdAt: Date;
}

const ResponseBodySchema = new Schema<IResponseBody>({
  historyId: { type: String, required: true, index: true },
  headers: [{
    key: { type: String, required: true },
    value: { type: String, required: true },
  }],
  body: Schema.Types.Mixed,
  cookies: [Schema.Types.Mixed],
  size: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

export const ResponseBody = mongoose.model<IResponseBody>('ResponseBody', ResponseBodySchema);
