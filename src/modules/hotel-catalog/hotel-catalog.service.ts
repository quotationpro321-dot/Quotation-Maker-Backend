import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";

import AppError from "../../utils/AppError";
import {
  CalculatorCatalogType,
  slugifyCatalogName,
} from "../catalog/catalog.types";
import type { THotelAreaDto, THotelDto } from "./hotel-catalog.types";
import { Hotel } from "./models/hotel.model";
import { HotelArea } from "./models/hotel-area.model";
import type {
  TCreateHotelAreaBody,
  TCreateHotelBody,
  TListHotelAreasQuery,
  TListHotelsQuery,
  TUpdateHotelAreaBody,
  TUpdateHotelBody,
} from "./hotel-catalog.validation";

function toAreaDto(doc: {
  _id: Types.ObjectId;
  slug: string;
  name: string;
  calculatorType: CalculatorCatalogType;
  sortOrder: number;
  isActive: boolean;
}): THotelAreaDto {
  return {
    id: String(doc._id),
    slug: doc.slug,
    name: doc.name,
    calculatorType: doc.calculatorType,
    sortOrder: doc.sortOrder,
    isActive: doc.isActive,
  };
}

function buildAreaFilter(query: TListHotelAreasQuery) {
  const filter: Record<string, unknown> = {};
  if (query.calculatorType) {
    filter.calculatorType = query.calculatorType;
  }
  if (!query.includeInactive) {
    filter.isActive = true;
  }
  return filter;
}

async function resolveArea(filter: {
  area?: string;
  areaId?: string;
  calculatorType?: CalculatorCatalogType;
  includeInactive?: boolean;
}) {
  const activeFilter = filter.includeInactive ? {} : { isActive: true };

  if (filter.areaId) {
    if (!Types.ObjectId.isValid(filter.areaId)) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid areaId");
    }
    const areaQuery: Record<string, unknown> = { _id: filter.areaId, ...activeFilter };
    if (filter.calculatorType) {
      areaQuery.calculatorType = filter.calculatorType;
    }
    const area = await HotelArea.findOne(areaQuery);
    if (!area) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Hotel area not found");
    }
    return area;
  }

  const slug = filter.area?.toLowerCase().trim();
  if (!slug) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Area slug is required");
  }

  const slugQuery: Record<string, unknown> = { slug, ...activeFilter };
  if (filter.calculatorType) {
    slugQuery.calculatorType = filter.calculatorType;
  }

  const area = await HotelArea.findOne(slugQuery);
  if (!area) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Hotel area not found");
  }
  return area;
}

async function assertUniqueAreaSlug(
  slug: string,
  calculatorType: CalculatorCatalogType,
  excludeId?: string,
) {
  const filter: Record<string, unknown> = { slug, calculatorType };
  if (excludeId) {
    filter._id = { $ne: excludeId };
  }
  const existing = await HotelArea.findOne(filter).lean();
  if (existing) {
    throw new AppError(
      StatusCodes.CONFLICT,
      "A hotel area with this slug already exists for this calculator type.",
    );
  }
}

export const hotelCatalogService = {
  async listAreas(query: TListHotelAreasQuery = { includeInactive: false }): Promise<THotelAreaDto[]> {
    const areas = await HotelArea.find(buildAreaFilter(query))
      .sort({ sortOrder: 1, name: 1 })
      .lean();
    return areas.map((area) => toAreaDto(area));
  },

  async listHotelsByArea(query: TListHotelsQuery): Promise<THotelDto[]> {
    const area = await resolveArea(query);
    const hotelFilter: Record<string, unknown> = { areaId: area._id };
    if (!query.includeInactive) {
      hotelFilter.isActive = true;
    }

    const hotels = await Hotel.find(hotelFilter)
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
      sortOrder: hotel.sortOrder,
      isActive: hotel.isActive,
    }));
  },

  async createArea(input: TCreateHotelAreaBody): Promise<THotelAreaDto> {
    const slug = (input.slug ?? slugifyCatalogName(input.name)).toLowerCase();
    if (!slug) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Area slug is required");
    }

    await assertUniqueAreaSlug(slug, input.calculatorType);

    const area = await HotelArea.create({
      slug,
      name: input.name.trim(),
      calculatorType: input.calculatorType,
      sortOrder: input.sortOrder ?? 0,
      isActive: true,
    });

    return toAreaDto(area);
  },

  async updateArea(id: string, input: TUpdateHotelAreaBody): Promise<THotelAreaDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid area id");
    }

    const area = await HotelArea.findById(id);
    if (!area) {
      throw new AppError(StatusCodes.NOT_FOUND, "Hotel area not found");
    }

    if (input.slug && input.slug !== area.slug) {
      await assertUniqueAreaSlug(input.slug, area.calculatorType, id);
      area.slug = input.slug.toLowerCase();
    }
    if (input.name !== undefined) area.name = input.name.trim();
    if (input.sortOrder !== undefined) area.sortOrder = input.sortOrder;
    if (input.isActive !== undefined) area.isActive = input.isActive;

    await area.save();
    return toAreaDto(area);
  },

  async deleteArea(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid area id");
    }

    const area = await HotelArea.findById(id);
    if (!area) {
      throw new AppError(StatusCodes.NOT_FOUND, "Hotel area not found");
    }

    area.isActive = false;
    await area.save();
    await Hotel.updateMany({ areaId: area._id }, { $set: { isActive: false } });
  },

  async createHotel(input: TCreateHotelBody): Promise<THotelDto> {
    if (!Types.ObjectId.isValid(input.areaId)) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid areaId");
    }

    const area = await HotelArea.findOne({ _id: input.areaId, isActive: true });
    if (!area) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Hotel area not found");
    }

    const existing = await Hotel.findOne({
      areaId: area._id,
      name: input.name.trim(),
    });
    if (existing) {
      throw new AppError(
        StatusCodes.CONFLICT,
        "A hotel with this name already exists in the selected area.",
      );
    }

    const hotel = await Hotel.create({
      areaId: area._id,
      name: input.name.trim(),
      city: input.city ?? "",
      country: input.country ?? "",
      distance: input.distance ?? "",
      sortOrder: input.sortOrder ?? 0,
      isActive: true,
    });

    return {
      id: String(hotel._id),
      name: hotel.name,
      city: hotel.city,
      country: hotel.country,
      distance: hotel.distance,
      areaId: String(area._id),
      areaSlug: area.slug,
      areaName: area.name,
      sortOrder: hotel.sortOrder,
      isActive: hotel.isActive,
    };
  },

  async updateHotel(id: string, input: TUpdateHotelBody): Promise<THotelDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid hotel id");
    }

    const hotel = await Hotel.findById(id);
    if (!hotel) {
      throw new AppError(StatusCodes.NOT_FOUND, "Hotel not found");
    }

    const area = await HotelArea.findById(hotel.areaId);
    if (!area) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Hotel area not found");
    }

    if (input.name !== undefined && input.name !== hotel.name) {
      const duplicate = await Hotel.findOne({
        areaId: hotel.areaId,
        name: input.name.trim(),
        _id: { $ne: hotel._id },
      });
      if (duplicate) {
        throw new AppError(
          StatusCodes.CONFLICT,
          "A hotel with this name already exists in the selected area.",
        );
      }
      hotel.name = input.name.trim();
    }
    if (input.city !== undefined) hotel.city = input.city;
    if (input.country !== undefined) hotel.country = input.country;
    if (input.distance !== undefined) hotel.distance = input.distance;
    if (input.sortOrder !== undefined) hotel.sortOrder = input.sortOrder;
    if (input.isActive !== undefined) hotel.isActive = input.isActive;

    await hotel.save();

    return {
      id: String(hotel._id),
      name: hotel.name,
      city: hotel.city,
      country: hotel.country,
      distance: hotel.distance,
      areaId: String(area._id),
      areaSlug: area.slug,
      areaName: area.name,
      sortOrder: hotel.sortOrder,
      isActive: hotel.isActive,
    };
  },

  async deleteHotel(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid hotel id");
    }

    const hotel = await Hotel.findById(id);
    if (!hotel) {
      throw new AppError(StatusCodes.NOT_FOUND, "Hotel not found");
    }

    hotel.isActive = false;
    await hotel.save();
  },
};
