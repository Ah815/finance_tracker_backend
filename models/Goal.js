const mongoose = require('mongoose');

const GoalSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: [
        'Emergency Fund', 'New Car', 'Laptop', 'House', 'Wedding',
        'Vacation', 'Investment Target', 'Education', 'Business', 'Other',
      ],
      default: 'Other',
    },
    targetAmount: { type: Number, required: true, min: 0 },
    currentAmount: { type: Number, default: 0, min: 0 },
    targetDate: { type: Date },
    monthlyContribution: { type: Number, default: 0, min: 0 },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    status: {
      type: String,
      enum: ['active', 'completed', 'paused'],
      default: 'active',
    },
  },
  { timestamps: true }
);

GoalSchema.virtual('progressPercent').get(function progressPercent() {
  if (!this.targetAmount) return 0;
  return Math.min(100, Math.round((this.currentAmount / this.targetAmount) * 1000) / 10);
});

GoalSchema.set('toJSON', { virtuals: true });
GoalSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Goal', GoalSchema);
