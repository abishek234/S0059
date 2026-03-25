const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  submissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WasteSubmission',
    required: true
  },
  ideaIndex: { type: Number, required: true },

  // Product details
  name: { type: String, required: true },
  description: { type: String, required: true },
  targetMarket: { type: String },
  imageUrl: { type: String },
  material: { type: String, required: true },
  quantity: { type: String, required: true },
  industry: { type: String, required: true },

  // Flexible properties
  properties: { type: mongoose.Schema.Types.Mixed, default: null },

  // Metrics
  co2Saved: { type: Number, default: 0 },
  waterSaved: { type: Number, default: 0 },
  profitMargin: { type: Number, default: 0 },
  feasibilityScore: { type: Number, default: 0 },

  // Status
  status: {
    type: String,
    enum: ['pending_verification', 'approved', 'rejected', 'deactivated'],
    default: 'pending_verification'
  },

  // Deactivation tracking
  deactivationReason: { type: String },
  deactivationType: {
    type: String,
    enum: ['admin_action', 'user_suspension', 'policy_violation', 'user_request'],
    default: 'admin_action'
  },
  deactivatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deactivatedAt: { type: Date },
  previousStatus: { type: String, enum: ['approved'] },
  rejectionReason: { type: String },

  // Review tracking
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },

  // ✅ Flexible adminNotes
  adminNotes: { type: mongoose.Schema.Types.Mixed, default: null },

  // Public visibility
  isPublic: { type: Boolean, default: false },
  publishedAt: { type: Date },

  // Engagement metrics
  viewCount: { type: Number, default: 0 },
  reportCount: { type: Number, default: 0 }

}, { timestamps: true });

// Helper methods
productSchema.methods.getPropertiesString = function() {
  if (!this.properties) return '';
  if (typeof this.properties === 'string') return this.properties;
  if (Array.isArray(this.properties)) return this.properties.join(', ');
  return String(this.properties);
};

productSchema.methods.getAdminNotesString = function() {
  if (!this.adminNotes) return '';
  if (typeof this.adminNotes === 'string') return this.adminNotes;
  if (Array.isArray(this.adminNotes)) return this.adminNotes.join(', ');
  return JSON.stringify(this.adminNotes);
};

module.exports = mongoose.model('Product', productSchema);