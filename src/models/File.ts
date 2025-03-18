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
  isFolder: {
    type: Boolean,
    default: false,
  },
  parentFolder: {
    type: String,
    default: null,
  },
  folderPath: {
    type: String,
    default: "",
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

// Add index for faster queries on walletAddress and createdAt
fileSchema.index({ walletAddress: 1, createdAt: -1 });
fileSchema.index({ walletAddress: 1, isFolder: 1 });
fileSchema.index({ parentFolder: 1 });

// Define interface for type safety
export interface IFile extends mongoose.Document {
  fileName: string;
  cid: string;
  size: string;
  mimeType: string;
  walletAddress: string;
  isFolder: boolean;
  parentFolder: string | null;
  folderPath: string;
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