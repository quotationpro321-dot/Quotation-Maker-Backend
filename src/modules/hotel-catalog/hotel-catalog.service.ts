import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";

import AppError from "../../utils/AppError";
import type { THotelAreaDto, THotelDto } from "./hotel-catalog.types";
import { Hotel } from "./models/hotel.model";
import { HotelArea } from "./models/hotel-area.model";

function toAreaDto(doc: { _id: Types.ObjectId; slug: string; name: string }): THotelAreaDto {
  return {
    id: String(doc._id),
    slug: doc.slug,
    name: doc.name,
  };
}

async function resolveArea(filter: { area?: string; areaId?: string }) {
  if (filter.areaId) {
    if (!Types.ObjectId.isValid(filter.areaId)) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid areaId");
    }
    const area = await HotelArea.findOne({ _id: filter.areaId, isActive: true });
    if (!area) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Hotel area not found");
    }
    return area;
  }

  const slug = filter.area?.toLowerCase().trim();
  if (!slug) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Area slug is required");
  }

  const area = await HotelArea.findOne({ slug, isActive: true });
  if (!area) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Hotel area not found");
  }
  return area;
}

export const hotelCatalogService = {
  async listAreas(): Promise<THotelAreaDto[]> {
    const areas = await HotelArea.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean();
    return areas.map((area) => toAreaDto(area));
  },

  async listHotelsByArea(filter: { area?: string; areaId?: string }): Promise<THotelDto[]> {
    const area = await resolveArea(filter);

    const hotels = await Hotel.find({ areaId: area._id, isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    return hotels.map((hotel) => ({
      id: String(hotel._id),
      name: hotel.name,
      city: hotel.city,
      country: hotel.country,
      distance: hotel.distance,
      areaId: String(area._id),
      areaSlug: area.slug,
      areaName: area.name,
    }));
  },
};
