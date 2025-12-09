import mongoose, { Schema, Document } from 'mongoose';

export interface IRequestBody extends Document {
  requestId: string;
  headers: Array<{ key: string; value: string; enabled?: boolean }>;
  body: {
    type: 'none' | 'json' | 'form-data' | 'xml' | 'raw' | 'binary';
    content: any;
  };
  auth?: {
    type: string;
    config: any;
  };
  preRequestScript?: string;
  testScript?: string;
  createdAt: Date;
}

const RequestBodySchema = new Schema<IRequestBody>({
  requestId: { type: String, required: true, index: true },
  headers: [{
    key: { type: String, required: true },
    value: { type: String, required: true },
    enabled: { type: Boolean, default: true },
  }],
  body: {
    type: {
      type: String,
      enum: ['none', 'json', 'form-data', 'xml', 'raw', 'binary'],
      default: 'none',
    },
    content: Schema.Types.Mixed,
  },
  auth: {
    type: {
      type: String,
      enum: ['noauth', 'basic', 'bearer', 'apikey', 'oauth1', 'oauth2', 'digest', 'awsv4'],
    },
    config: Schema.Types.Mixed,
  },
  preRequestScript: String,
  testScript: String,
  createdAt: { type: Date, default: Date.now },
});

export const RequestBody = mongoose.model<IRequestBody>('RequestBody', RequestBodySchema);
