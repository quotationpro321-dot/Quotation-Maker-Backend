import mongoose, { Model } from "mongoose";

export interface IAirport {
  iata: string;
  icao?: string;
  name: string;
  city?: string;
  country?: string;
  timezone?: string;
}

const airportSchema = new mongoose.Schema<IAirport>(
  {
    iata: { type: String, required: true, unique: true, uppercase: true, trim: true },
    icao: { type: String, uppercase: true, trim: true },
    name: { type: String, required: true },
    city: { type: String },
    country: { type: String },
    timezone: { type: String },
  },
  { versionKey: false, timestamps: true },
);

export const Airport: Model<IAirport> =
  mongoose.models.Airport ?? mongoose.model<IAirport>("Airport", airportSchema);
