import mongoose, { Model, Types } from "mongoose";

export interface ITransferLocation {
  slug: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

const transferLocationSchema = new mongoose.Schema<ITransferLocation>(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { versionKey: false, timestamps: true },
);

export type TTransferLocationDocument = ITransferLocation & { _id: Types.ObjectId };

export const TransferLocation: Model<ITransferLocation> =
  mongoose.models.TransferLocation ??
  mongoose.model<ITransferLocation>("TransferLocation", transferLocationSchema);
