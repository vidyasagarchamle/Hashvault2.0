// Constants
import { FREE_STORAGE_LIMIT, STORAGE_PLAN_SIZE, STORAGE_PLAN_PRICE } from '@/lib/constants';

import mongoose from 'mongoose';

const storagePlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    default: '5GB Storage Plan'
  },
  sizeInBytes: {
    type: Number,
    required: true,
    default: STORAGE_PLAN_SIZE
  },
  priceInUSD: {
    type: Number,
    required: true,
    default: STORAGE_PLAN_PRICE
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

const storagePurchaseSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StoragePlan',
    required: true
  },
  transactionHash: {
    type: String,
    required: true
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  }
});

// Only create models on the server side
export const StoragePlan = mongoose.models.StoragePlan || mongoose.model('StoragePlan', storagePlanSchema);
export const StoragePurchase = mongoose.models.StoragePurchase || mongoose.model('StoragePurchase', storagePurchaseSchema); 