import dotenv from "dotenv";

dotenv.config();

import { connectDB } from "../config/db";
import { SEED_AIRLINES, SEED_AIRPORTS } from "../modules/flight-converter/data/flight-reference.seed-data";
import { Airline } from "../modules/flight-converter/models/airline.model";
import { Airport } from "../modules/flight-converter/models/airport.model";

async function seedFlightReferenceData() {
  await connectDB();

  const airlineOps = Object.entries(SEED_AIRLINES).map(([iata, data]) =>
    Airline.updateOne(
      { iata },
      {
        $set: {
          iata,
          name: data.name,
          logoPath: data.logoPath,
        },
      },
      { upsert: true },
    ),
  );

  const airportOps = Object.entries(SEED_AIRPORTS).map(([iata, data]) =>
    Airport.updateOne(
      { iata },
      {
        $set: {
          iata,
          name: data.name,
          city: data.city,
          country: data.country,
        },
      },
      { upsert: true },
    ),
  );

  await Promise.all([...airlineOps, ...airportOps]);

  console.log(
    `Flight reference seed complete: ${Object.keys(SEED_AIRLINES).length} airlines, ${Object.keys(SEED_AIRPORTS).length} airports.`,
  );

  process.exit(0);
}

seedFlightReferenceData().catch((err) => {
  console.error(err);
  process.exit(1);
});
