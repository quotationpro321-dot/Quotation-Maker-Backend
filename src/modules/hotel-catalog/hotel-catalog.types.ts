export type THotelAreaDto = {
  id: string;
  slug: string;
  name: string;
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
};
