import mongoose, { Model, Types } from "mongoose";

import { CalculatorCatalogType } from "../../catalog/catalog.types";

export interface IHotelArea {
  slug: string;
  name: string;
  calculatorType: CalculatorCatalogType;
  sortOrder: number;
  isActive: boolean;
}

const hotelAreaSchema = new mongoose.Schema<IHotelArea>(
  {
    slug: { type: String, required: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    calculatorType: {
      type: String,
      enum: Object.values(CalculatorCatalogType),
      required: true,
      default: CalculatorCatalogType.UMRAH,
    },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { versionKey: false, timestamps: true },
);

hotelAreaSchema.index({ slug: 1, calculatorType: 1 }, { unique: true });
hotelAreaSchema.index({ calculatorType: 1, isActive: 1, sortOrder: 1 });

export type THotelAreaDocument = IHotelArea & { _id: Types.ObjectId };

export const HotelArea: Model<IHotelArea> =
  mongoose.models.HotelArea ?? mongoose.model<IHotelArea>("HotelArea", hotelAreaSchema);
