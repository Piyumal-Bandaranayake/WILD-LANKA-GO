// src/models/tourmanagement/notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userType: {
      type: String,
      enum: ['TourGuide', 'Driver'],  // ✅ can extend later (Vet, Admin, etc.)
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      // No ref since we'll handle the reference manually based on userType
    },
    tourId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tour',
      required: true,
    },
    type: {
      type: String,
      enum: ['ASSIGNED_TOUR'],
      default: 'ASSIGNED_TOUR',
    },
    title: {
      type: String,
      default: 'New tour assigned',
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    meta: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
