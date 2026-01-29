// models/Report.js - NEW FILE
const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  reporterEmail: { type: String, required: true },
  reason: { 
    type: String, 
    required: true,
    enum: ['misleading', 'inappropriate', 'spam', 'copyright', 'other']
  },
  details: { type: String },
  status: {
    type: String,
    enum: ['pending', 'resolved', 'dismissed'],
    default: 'pending'
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: { type: Date },
  adminNotes: { type: String }
}, {
  timestamps: true
});

module.exports = mongoose.model("Report", reportSchema);