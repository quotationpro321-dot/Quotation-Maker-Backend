import { model, Schema } from "mongoose";
import { IAnalytics } from "./analytics.types";

const analyticsSchema = new Schema<IAnalytics>(
  {
    eventName: {
      type: String,
      required: true,
    },
    eventType: {
      type: String,
      enum: ["PageView", "FormSubmit", "Booking", "Contact", "Custom"],
      required: true,
    },
    page: String,
    referrer: String,
    userAgent: String,
    ipAddress: String,
    metadata: Schema.Types.Mixed,
  },
  {
    timestamps: true,
  },
);

// Index for better query performance
analyticsSchema.index({ createdAt: -1 });
analyticsSchema.index({ eventType: 1 });

export const Analytics = model<IAnalytics>("Analytics", analyticsSchema);
