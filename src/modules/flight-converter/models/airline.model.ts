import mongoose, { Model } from "mongoose";

export interface IAirline {
  iata: string;
  name: string;
  country?: string;
  logoPath: string;
}

const airlineSchema = new mongoose.Schema<IAirline>(
  {
    iata: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true },
    country: { type: String },
    logoPath: { type: String, required: true },
  },
  { versionKey: false, timestamps: true },
);

export const Airline: Model<IAirline> =
  mongoose.models.Airline ?? mongoose.model<IAirline>("Airline", airlineSchema);
