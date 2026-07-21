import dotenv from "dotenv";

dotenv.config();

import { connectDB } from "../config/db";
import { CalculatorCatalogType } from "../modules/catalog/catalog.types";
import { SEED_TRANSFER_LOCATIONS } from "../modules/transfer-catalog/data/transfer-reference.seed-data";
import { TransferLocation } from "../modules/transfer-catalog/models/transfer-location.model";

async function seedTransferReferenceData() {
  await connectDB();

  for (const location of SEED_TRANSFER_LOCATIONS) {
    const calculatorType =
      location.calculatorType === "holiday"
        ? CalculatorCatalogType.HOLIDAY
        : CalculatorCatalogType.UMRAH;

    await TransferLocation.updateOne(
      { slug: location.slug, calculatorType },
      {
        $set: {
          slug: location.slug,
          name: location.name,
          calculatorType,
          sortOrder: location.sortOrder,
          isActive: true,
        },
      },
      { upsert: true },
    );
  }

  console.log(
    `Transfer reference seed complete: ${SEED_TRANSFER_LOCATIONS.length} locations.`,
  );

  process.exit(0);
}

seedTransferReferenceData().catch((err) => {
  console.error(err);
  process.exit(1);
});
