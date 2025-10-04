import mongoose from 'mongoose';

const ChatSchema = new mongoose.Schema({
  chatId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  messages: [{
    id: {
      type: Number,
      required: true
    },
    text: {
      type: String,
      required: true
    },
    sender: {
      type: String,
      required: true,
      enum: ['user', 'meena']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    language: {
      type: String,
      default: 'English'
    },
    metadata: {
      hasContext: Boolean,
      contextLength: Number,
      urlsProcessed: [String],
      model: String,
      triggers: [String]
    }
  }],
  lastActivity: {
    type: Date,
    default: Date.now
  },
  totalMessages: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  collection: 'chats'
});

// Index for efficient queries
ChatSchema.index({ chatId: 1, 'messages.timestamp': -1 });
ChatSchema.index({ userId: 1, lastActivity: -1 });

// Update lastActivity on new messages
ChatSchema.pre('save', function(next) {
  this.lastActivity = new Date();
  this.totalMessages = this.messages.length;
  next();
});

// Prevent re-compilation in development
const Chat = mongoose.models.Chat || mongoose.model('Chat', ChatSchema);

export default Chat;
