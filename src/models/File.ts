import mongoose, { Model } from 'mongoose';

const fileSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true,
  },
  cid: {
    type: String,
    required: true,
    unique: true,
  },
  size: {
    type: String,
    required: true,
  },
  mimeType: {
    type: String,
    required: true,
  },
  walletAddress: {
    type: String,
    required: true,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true, // This will automatically manage createdAt and updatedAt
  toJSON: { virtuals: true }, // Include virtuals when converting to JSON
  toObject: { virtuals: true } // Include virtuals when converting to Object
});

// Add indexes for faster queries
fileSchema.index({ walletAddress: 1, createdAt: -1 });
fileSchema.index({ cid: 1 });

// Define interface for type safety
export interface IFile extends mongoose.Document {
  fileName: string;
  cid: string;
  size: string;
  mimeType: string;
  walletAddress: string;
  createdAt: Date;
  updatedAt: Date;
}

// Create or get the model
let FileModel: Model<IFile>;

try {
  FileModel = mongoose.model<IFile>('File');
} catch {
  FileModel = mongoose.model<IFile>('File', fileSchema);
}

export default FileModel; 