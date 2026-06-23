import mongoose, { Model, Types } from "mongoose";

import {
  QuotationCalculatorType,
  QuotationStatus,
  QuotationTemplateId,
  type TQuotationCalculatorTypeStates,
} from "./quotation.types";

export type IQuotation = {
  referenceNumber: number;
  customerName: string;
  customerNumber: string;
  calculatorType: QuotationCalculatorType;
  quotationDate: Date;
  status: QuotationStatus;
  currency: string;
  templateId: QuotationTemplateId;
  calculatorStates: TQuotationCalculatorTypeStates;
  createdBy: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
};

const quotationSchema = new mongoose.Schema<IQuotation>(
  {
    referenceNumber: { type: Number, required: true, unique: true, index: true },
    customerName: { type: String, required: true, trim: true, index: true },
    customerNumber: { type: String, default: "", trim: true },
    calculatorType: {
      type: String,
      enum: Object.values(QuotationCalculatorType),
      required: true,
    },
    quotationDate: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: Object.values(QuotationStatus),
      default: QuotationStatus.DRAFT,
      index: true,
    },
    currency: { type: String, default: "GBP", trim: true },
    templateId: {
      type: String,
      enum: Object.values(QuotationTemplateId),
      default: QuotationTemplateId.CLASSIC,
    },
    calculatorStates: { type: mongoose.Schema.Types.Mixed, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

quotationSchema.index({ customerName: "text" });

export const Quotation = mongoose.model<IQuotation>("Quotation", quotationSchema) as Model<IQuotation>;
