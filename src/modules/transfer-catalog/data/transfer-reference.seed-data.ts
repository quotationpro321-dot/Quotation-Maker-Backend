export const SEED_TRANSFER_LOCATIONS: Array<{
  slug: string;
  name: string;
  sortOrder: number;
  calculatorType: "umrah" | "holiday";
}> = [
  { slug: "jeddah-airport", name: "Jeddah Airport", sortOrder: 1, calculatorType: "umrah" },
  { slug: "makkah-hotel", name: "Makkah Hotel", sortOrder: 2, calculatorType: "umrah" },
  { slug: "madinah-hotel", name: "Madinah Hotel", sortOrder: 3, calculatorType: "umrah" },
  { slug: "madinah-airport", name: "Madinah Airport", sortOrder: 4, calculatorType: "umrah" },
  { slug: "haram", name: "Haram", sortOrder: 5, calculatorType: "umrah" },
  { slug: "train-station", name: "Train Station", sortOrder: 6, calculatorType: "umrah" },
  { slug: "airport", name: "Airport", sortOrder: 1, calculatorType: "holiday" },
  { slug: "hotel", name: "Hotel", sortOrder: 2, calculatorType: "holiday" },
];
