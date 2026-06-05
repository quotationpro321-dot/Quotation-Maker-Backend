import type { TTransferLocationDto } from "./transfer-catalog.types";
import { TransferLocation } from "./models/transfer-location.model";

export const transferCatalogService = {
  async listLocations(): Promise<TTransferLocationDto[]> {
    const locations = await TransferLocation.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    return locations.map((location) => ({
      id: String(location._id),
      slug: location.slug,
      name: location.name,
    }));
  },
};
