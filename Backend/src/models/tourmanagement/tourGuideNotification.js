// src/models/tourmanagement/notification.js
import mongoose from 'mongoose';

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
      refPath: 'userType',   // ✅ dynamic reference (TourGuide or SafariDriver)
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
export default Notification;
