export type THotelAreaDto = {
  id: string;
  slug: string;
  name: string;
  calculatorType: "umrah" | "holiday";
  sortOrder: number;
  isActive: boolean;
};

export type THotelDto = {
  id: string;
  name: string;
  city: string;
  country: string;
  distance: string;
  areaId: string;
  areaSlug: string;
  areaName: string;
  sortOrder: number;
  isActive: boolean;
};
