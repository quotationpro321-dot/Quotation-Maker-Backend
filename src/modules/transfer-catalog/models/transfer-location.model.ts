import mongoose, { Model, Types } from "mongoose";

import { CalculatorCatalogType } from "../../catalog/catalog.types";

export interface ITransferLocation {
  slug: string;
  name: string;
  calculatorType: CalculatorCatalogType;
  sortOrder: number;
  isActive: boolean;
}

const transferLocationSchema = new mongoose.Schema<ITransferLocation>(
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

transferLocationSchema.index({ slug: 1, calculatorType: 1 }, { unique: true });
transferLocationSchema.index({ calculatorType: 1, isActive: 1, sortOrder: 1 });

export type TTransferLocationDocument = ITransferLocation & { _id: Types.ObjectId };

export const TransferLocation: Model<ITransferLocation> =
  mongoose.models.TransferLocation ??
  mongoose.model<ITransferLocation>("TransferLocation", transferLocationSchema);
