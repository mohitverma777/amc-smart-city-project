const mongoose = require('mongoose');

const knowledgeBaseSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    index: true
  },
  question: {
    type: String,
    required: true,
    index: 'text'
  },
  answer: {
    type: String,
    required: true
  },
  keywords: [{
    type: String,
    index: true
  }],
  priority: {
    type: Number,
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

knowledgeBaseSchema.index({
  question: 'text',
  answer: 'text',
  keywords: 'text'
});

module.exports = mongoose.model('KnowledgeBase', knowledgeBaseSchema);
