import mongoose from 'mongoose';

const HumanFallbackSchema = new mongoose.Schema({
  query: {
    type: String,
    required: true,
    trim: true
  },
  userContact: {
    phone: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: false
    },
    chatId: {
      type: String,
      required: false // Telegram chat ID if available
    }
  },
  originalResponse: {
    type: String,
    required: true // The "I don't know" response from LLM
  },
  context: {
    previousMessages: [{
      role: String,
      content: String
    }],
    sessionId: String,
    platform: {
      type: String,
      enum: ['web', 'telegram', 'whatsapp'],
      default: 'web'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'resolved', 'closed'],
    default: 'pending'
  },
  adminResponse: {
    content: String,
    respondedBy: String,
    respondedAt: Date
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['academic', 'admission', 'hostel', 'fees', 'placement', 'general', 'technical'],
    default: 'general'
  },
  metadata: {
    userAgent: String,
    ipAddress: String,
    referrer: String,
    knowledgeBaseHits: Number
  }
}, {
  timestamps: true
});

// Index for efficient querying
HumanFallbackSchema.index({ status: 1, createdAt: -1 });
HumanFallbackSchema.index({ 'userContact.phone': 1 });
HumanFallbackSchema.index({ category: 1, priority: 1 });

export default mongoose.models.HumanFallback || mongoose.model('HumanFallback', HumanFallbackSchema);