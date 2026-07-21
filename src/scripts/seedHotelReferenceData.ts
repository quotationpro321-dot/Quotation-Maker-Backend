import dotenv from "dotenv";

dotenv.config();

import { connectDB } from "../config/db";
import { CalculatorCatalogType } from "../modules/catalog/catalog.types";
import {
  SEED_HOTEL_AREAS,
  SEED_HOTELS_BY_AREA_SLUG,
} from "../modules/hotel-catalog/data/hotel-reference.seed-data";
import { HotelArea } from "../modules/hotel-catalog/models/hotel-area.model";
import { Hotel } from "../modules/hotel-catalog/models/hotel.model";

async function seedHotelReferenceData() {
  await connectDB();

  const areaIdBySlug = new Map<string, string>();

  for (const area of SEED_HOTEL_AREAS) {
    const calculatorType =
      area.calculatorType === "holiday"
        ? CalculatorCatalogType.HOLIDAY
        : CalculatorCatalogType.UMRAH;

    await HotelArea.updateOne(
      { slug: area.slug, calculatorType },
      {
        $set: {
          slug: area.slug,
          name: area.name,
          calculatorType,
          sortOrder: area.sortOrder,
          isActive: true,
        },
      },
      { upsert: true },
    );

    const doc = await HotelArea.findOne({ slug: area.slug, calculatorType }).lean();
    if (!doc?._id) continue;
    areaIdBySlug.set(`${area.calculatorType}:${area.slug}`, String(doc._id));
  }

  let hotelCount = 0;

  for (const [slug, hotels] of Object.entries(SEED_HOTELS_BY_AREA_SLUG)) {
    const areaMeta = SEED_HOTEL_AREAS.find((area) => area.slug === slug);
    const areaId = areaMeta
      ? areaIdBySlug.get(`${areaMeta.calculatorType}:${slug}`)
      : undefined;
    if (!areaId) continue;

    for (const hotel of hotels) {
      await Hotel.updateOne(
        { areaId, name: hotel.name },
        {
          $set: {
            areaId,
            name: hotel.name,
            city: hotel.city,
            country: hotel.country,
            distance: hotel.distance,
            sortOrder: hotel.sortOrder,
            isActive: true,
          },
        },
        { upsert: true },
      );
      hotelCount += 1;
    }
  }

  console.log(
    `Hotel reference seed complete: ${SEED_HOTEL_AREAS.length} areas, ${hotelCount} hotels.`,
  );

  process.exit(0);
}

seedHotelReferenceData().catch((err) => {
  console.error(err);
  process.exit(1);
});
