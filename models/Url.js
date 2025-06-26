const mongoose = require('mongoose');

const UrlSchema = new mongoose.Schema({
  shortCode: {
    type: String,
    required: true,
    unique: true,
  },
  longUrl: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
  },
  clicks: [
    {
      timestamp: {
        type: Date,
        default: Date.now,
      },
      referrer: {
        type: String,
      },
      ip: {
        type: String,
      }
    }
  ],
});

module.exports = mongoose.model('Url', UrlSchema); 