export type THotelSeedEntry = {
  name: string;
  city: string;
  country: string;
  distance: string;
  sortOrder: number;
};

export const SEED_HOTEL_AREAS: Array<{
  slug: string;
  name: string;
  sortOrder: number;
  calculatorType: "umrah" | "holiday";
}> = [
  { slug: "makkah", name: "Makkah", sortOrder: 1, calculatorType: "umrah" },
  { slug: "madinah", name: "Madinah", sortOrder: 2, calculatorType: "umrah" },
  { slug: "holiday", name: "Holiday", sortOrder: 1, calculatorType: "holiday" },
  { slug: "jeddah", name: "Jeddah", sortOrder: 2, calculatorType: "holiday" },
];

export const SEED_HOTELS_BY_AREA_SLUG: Record<string, THotelSeedEntry[]> = {
  makkah: [
    { name: "Fairmont Makkah", city: "Makkah", country: "Saudi Arabia", distance: "0-1 Minutes", sortOrder: 1 },
    { name: "Pullman Zamzam", city: "Makkah", country: "Saudi Arabia", distance: "1-2 Minutes", sortOrder: 2 },
    { name: "Swissôtel Makkah", city: "Makkah", country: "Saudi Arabia", distance: "0-1 Minutes", sortOrder: 3 },
    { name: "Movenpick Hajar", city: "Makkah", country: "Saudi Arabia", distance: "1-2 Minutes", sortOrder: 4 },
    { name: "Adnan Hotel", city: "Makkah", country: "Saudi Arabia", distance: "8-10 Minutes", sortOrder: 5 },
    { name: "Hilton Makkah Convention Hotel", city: "Makkah", country: "Saudi Arabia", distance: "5-7 Minutes", sortOrder: 6 },
  ],
  madinah: [
    { name: "Anwar Al Madinah", city: "Madinah", country: "Saudi Arabia", distance: "0-1 Minutes", sortOrder: 1 },
    { name: "Hilton Madinah", city: "Madinah", country: "Saudi Arabia", distance: "1-2 Minutes", sortOrder: 2 },
    { name: "Pullman Zamzam Madinah", city: "Madinah", country: "Saudi Arabia", distance: "2-3 Minutes", sortOrder: 3 },
    { name: "Shaza Al Madinah", city: "Madinah", country: "Saudi Arabia", distance: "3-4 Minutes", sortOrder: 4 },
    { name: "Frontel Al Haritiya", city: "Madinah", country: "Saudi Arabia", distance: "4-5 Minutes", sortOrder: 5 },
    { name: "InterContinental Dar Al Iman", city: "Madinah", country: "Saudi Arabia", distance: "2-3 Minutes", sortOrder: 6 },
  ],
  holiday: [
    { name: "Dubai Atlantis", city: "Dubai", country: "UAE", distance: "", sortOrder: 1 },
    { name: "Istanbul Marriott", city: "Istanbul", country: "Turkey", distance: "", sortOrder: 2 },
    { name: "London Hilton", city: "London", country: "UK", distance: "", sortOrder: 3 },
    { name: "Paris Hyatt", city: "Paris", country: "France", distance: "", sortOrder: 4 },
  ],
  jeddah: [
    { name: "InterContinental Jeddah", city: "Jeddah", country: "Saudi Arabia", distance: "", sortOrder: 1 },
    { name: "Jeddah Hilton", city: "Jeddah", country: "Saudi Arabia", distance: "", sortOrder: 2 },
    { name: "Radisson Blu Jeddah", city: "Jeddah", country: "Saudi Arabia", distance: "", sortOrder: 3 },
  ],
};
