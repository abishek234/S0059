// models/WasteSubmission.js - Updated
const mongoose = require("mongoose");

const wasteSubmissionSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  // Input Data
  material: { type: String, required: true },
  quantity: { type: String, required: true },
  properties: [String],
  industry: { type: String, required: true },
  
  // AI Generated Output
  productIdeas: [{
    name: String,
    description: String,
    targetMarket: String,
    imageUrl: String,
    
    // Business Intelligence
    researchQuestions: [String],
    successFactors: [String],
    
    // Impact Metrics
    co2Saved: Number,
    waterSaved: Number,
    profitMargin: Number,
    feasibilityScore: Number,
    
    // NEW: Track if this idea has been published
    isPublished: { type: Boolean, default: false },
    publishedProductId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }
  }],
  
  // Status
  status: { 
    type: String, 
    enum: ['processing', 'completed', 'failed'],
    default: 'processing'
  },
  
  // Error tracking
  errorMessage: String
  
}, {
  timestamps: true
});

module.exports = mongoose.model("WasteSubmission", wasteSubmissionSchema);