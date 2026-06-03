import dotenv from "dotenv";

dotenv.config();

import { connectDB } from "../config/db";
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
    const doc = await HotelArea.findOneAndUpdate(
      { slug: area.slug },
      {
        $set: {
          slug: area.slug,
          name: area.name,
          sortOrder: area.sortOrder,
          isActive: true,
        },
      },
      { upsert: true, new: true },
    );
    areaIdBySlug.set(area.slug, String(doc._id));
  }

  let hotelCount = 0;

  for (const [slug, hotels] of Object.entries(SEED_HOTELS_BY_AREA_SLUG)) {
    const areaId = areaIdBySlug.get(slug);
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
