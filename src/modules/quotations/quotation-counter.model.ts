import mongoose, { Model } from "mongoose";

type TQuotationCounter = {
  _id: string;
  seq: number;
};

const quotationCounterSchema = new mongoose.Schema<TQuotationCounter>(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
  },
  { versionKey: false },
);

export const QuotationCounter = mongoose.model<TQuotationCounter>(
  "QuotationCounter",
  quotationCounterSchema,
) as Model<TQuotationCounter>;

export async function getNextReferenceNumber(): Promise<number> {
  const counter = await QuotationCounter.findByIdAndUpdate(
    "quotationReference",
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  ).lean();

  return counter?.seq ?? 1;
}
