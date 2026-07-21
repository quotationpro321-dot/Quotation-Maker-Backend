import mongoose, { Model, Types } from "mongoose";

export interface IFlightConverterUsage {
  userId: Types.ObjectId;
  segmentCount: number;
  parsedAt: Date;
}

const flightConverterUsageSchema = new mongoose.Schema<IFlightConverterUsage>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    segmentCount: { type: Number, default: 0 },
    parsedAt: { type: Date, default: Date.now, index: true },
  },
  { versionKey: false },
);

flightConverterUsageSchema.index({ parsedAt: -1 });

export const FlightConverterUsage: Model<IFlightConverterUsage> =
  mongoose.models.FlightConverterUsage ??
  mongoose.model<IFlightConverterUsage>("FlightConverterUsage", flightConverterUsageSchema);

export async function logFlightConverterUsage(userId: string, segmentCount: number) {
  if (!Types.ObjectId.isValid(userId)) return;
  await FlightConverterUsage.create({
    userId,
    segmentCount,
    parsedAt: new Date(),
  });
}
