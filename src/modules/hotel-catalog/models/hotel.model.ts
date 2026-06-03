import mongoose, { Model, Types } from "mongoose";

export interface IHotel {
  areaId: Types.ObjectId;
  name: string;
  city: string;
  country: string;
  distance: string;
  sortOrder: number;
  isActive: boolean;
}

const hotelSchema = new mongoose.Schema<IHotel>(
  {
    areaId: { type: mongoose.Schema.Types.ObjectId, ref: "HotelArea", required: true },
    name: { type: String, required: true, trim: true },
    city: { type: String, default: "", trim: true },
    country: { type: String, default: "", trim: true },
    distance: { type: String, default: "", trim: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { versionKey: false, timestamps: true },
);

hotelSchema.index({ areaId: 1, name: 1 }, { unique: true });
hotelSchema.index({ areaId: 1, isActive: 1, sortOrder: 1 });

export type THotelDocument = IHotel & { _id: Types.ObjectId };

export const Hotel: Model<IHotel> =
  mongoose.models.Hotel ?? mongoose.model<IHotel>("Hotel", hotelSchema);
