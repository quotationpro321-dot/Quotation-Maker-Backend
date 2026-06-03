import mongoose, { Model, Types } from "mongoose";

export interface IHotelArea {
  slug: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

const hotelAreaSchema = new mongoose.Schema<IHotelArea>(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { versionKey: false, timestamps: true },
);

export type THotelAreaDocument = IHotelArea & { _id: Types.ObjectId };

export const HotelArea: Model<IHotelArea> =
  mongoose.models.HotelArea ?? mongoose.model<IHotelArea>("HotelArea", hotelAreaSchema);
