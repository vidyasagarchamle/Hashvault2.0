import mongoose, { Document } from 'mongoose';
import { FREE_STORAGE_LIMIT } from '@/lib/constants';

export interface IUser extends Document {
  walletAddress: string;
  totalStorageUsed: number;
  totalStoragePurchased: number;
  totalAvailableStorage: number;
  lastStorageCheck: Date;
  createdAt: Date;
  updatedAt: Date;
  name?: string;
  email?: string;
  image?: string;
  remainingStorage: number;
  hasEnoughStorage(requiredSize: number): boolean;
}

const userSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    default: null,
  },
  name: {
    type: String,
    required: false,
  },
  image: {
    type: String,
  },
  totalStorageUsed: {
    type: Number,
    default: 0,
  },
  totalStoragePurchased: {
    type: Number,
    default: 0,
  },
  totalAvailableStorage: {
    type: Number,
    default: 0,
  },
  lastStorageCheck: {
    type: Date,
    default: Date.now,
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
  timestamps: true
});

// Virtual for total available storage
userSchema.virtual('totalAvailableStorage').get(function() {
  return FREE_STORAGE_LIMIT + this.totalStoragePurchased;
});

// Virtual for remaining storage
userSchema.virtual('remainingStorage').get(function(this: IUser) {
  return Math.max(0, this.totalAvailableStorage - this.totalStorageUsed);
});

// Method to check if user has enough storage
userSchema.methods.hasEnoughStorage = function(requiredSize: number): boolean {
  return this.remainingStorage >= requiredSize;
};

// Method to update storage usage
userSchema.methods.updateStorageUsage = async function(bytesUsed: number): Promise<void> {
  this.totalStorageUsed += bytesUsed;
  this.updatedAt = new Date();
  await this.save();
};

// Delete the existing User model if it exists
if (mongoose.models.User) {
  delete mongoose.models.User;
}

export const User = mongoose.model<IUser>('User', userSchema); 