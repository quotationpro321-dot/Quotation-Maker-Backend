import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";

import AppError from "../../utils/AppError";
import {
  CalculatorCatalogType,
  slugifyCatalogName,
} from "../catalog/catalog.types";
import type { TTransferLocationDto } from "./transfer-catalog.types";
import { TransferLocation } from "./models/transfer-location.model";
import type {
  TCreateTransferLocationBody,
  TListTransferLocationsQuery,
  TUpdateTransferLocationBody,
} from "./transfer-catalog.validation";

function toLocationDto(doc: {
  _id: Types.ObjectId;
  slug: string;
  name: string;
  calculatorType: CalculatorCatalogType;
  sortOrder: number;
  isActive: boolean;
}): TTransferLocationDto {
  return {
    id: String(doc._id),
    slug: doc.slug,
    name: doc.name,
    calculatorType: doc.calculatorType,
    sortOrder: doc.sortOrder,
    isActive: doc.isActive,
  };
}

function buildLocationFilter(query: TListTransferLocationsQuery) {
  const filter: Record<string, unknown> = {};
  if (query.calculatorType) {
    filter.calculatorType = query.calculatorType;
  }
  if (!query.includeInactive) {
    filter.isActive = true;
  }
  return filter;
}

async function assertUniqueLocationSlug(
  slug: string,
  calculatorType: CalculatorCatalogType,
  excludeId?: string,
) {
  const filter: Record<string, unknown> = { slug, calculatorType };
  if (excludeId) {
    filter._id = { $ne: excludeId };
  }
  const existing = await TransferLocation.findOne(filter).lean();
  if (existing) {
    throw new AppError(
      StatusCodes.CONFLICT,
      "A transfer location with this slug already exists for this calculator type.",
    );
  }
}

export const transferCatalogService = {
  async listLocations(
    query: TListTransferLocationsQuery = { includeInactive: false },
  ): Promise<TTransferLocationDto[]> {
    const locations = await TransferLocation.find(buildLocationFilter(query))
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    return locations.map((location) => toLocationDto(location));
  },

  async createLocation(
    input: TCreateTransferLocationBody,
  ): Promise<TTransferLocationDto> {
    const slug = (input.slug ?? slugifyCatalogName(input.name)).toLowerCase();
    if (!slug) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Location slug is required");
    }

    await assertUniqueLocationSlug(slug, input.calculatorType);

    const location = await TransferLocation.create({
      slug,
      name: input.name.trim(),
      calculatorType: input.calculatorType,
      sortOrder: input.sortOrder ?? 0,
      isActive: true,
    });

    return toLocationDto(location);
  },

  async updateLocation(
    id: string,
    input: TUpdateTransferLocationBody,
  ): Promise<TTransferLocationDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid location id");
    }

    const location = await TransferLocation.findById(id);
    if (!location) {
      throw new AppError(StatusCodes.NOT_FOUND, "Transfer location not found");
    }

    if (input.slug && input.slug !== location.slug) {
      await assertUniqueLocationSlug(input.slug, location.calculatorType, id);
      location.slug = input.slug.toLowerCase();
    }
    if (input.name !== undefined) location.name = input.name.trim();
    if (input.sortOrder !== undefined) location.sortOrder = input.sortOrder;
    if (input.isActive !== undefined) location.isActive = input.isActive;

    await location.save();
    return toLocationDto(location);
  },

  async deleteLocation(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid location id");
    }

    const location = await TransferLocation.findById(id);
    if (!location) {
      throw new AppError(StatusCodes.NOT_FOUND, "Transfer location not found");
    }

    location.isActive = false;
    await location.save();
  },
};
