export enum QuotationStatus {
  DRAFT = "draft",
  PENDING = "pending",
  CONFIRMED = "confirmed",
  CANCELLED = "cancelled",
}

export enum QuotationCalculatorType {
  UMRAH = "umrah",
  HOLIDAY = "holiday",
  FLIGHTS = "flights",
}

export enum QuotationTemplateId {
  CLASSIC = "classic",
  MODERN = "modern",
  COMPACT = "compact",
}

export enum QuotationCustomerSource {
  FACEBOOK = "facebook",
  GOOGLE = "google",
  INSTAGRAM = "instagram",
  WEBSITE = "website",
  OFFLINE = "offline",
  REFERRAL = "referral",
  REFERENCE = "reference",
  WALK_IN = "walk_in",
}

export type TQuotationHotel = {
  name: string;
  city: string;
  country: string;
  location: string;
  areaSlug?: string;
  distance: string;
  checkIn: string;
  checkOut: string;
  roomType: string;
  board: string;
  cost: number;
};

export type TQuotationFlightFamily = {
  id: string;
  title: string;
  flightAdult: number;
  flightYouth: number;
  flightChild: number;
  flightInfant: number;
  rawItinerary: string;
  flightSegments: unknown[];
  flightItineraryMode: "text" | "image";
  flightItineraryImage: string;
  holdLuggage: string;
  cabinLuggage: string;
};

export type TQuotationOption = {
  id: string;
  title: string;
  flightAdult: number;
  flightYouth: number;
  flightChild: number;
  flightInfant: number;
  flightFamilies?: TQuotationFlightFamily[];
  hotels: TQuotationHotel[];
  visaUmrah: { pax: number; cost: number };
  visaEVW: { pax: number; cost: number };
  visaHoliday: { pax: number; cost: number };
  visaSaudiTourist: { pax: number; cost: number };
  transferCost: number;
  ziyarahCost: number;
  includedServices: Record<string, boolean>;
  customIncludedServices: Array<{ id: string; label: string; included: boolean }>;
  vehicleName: string;
  vehicleQuantity: number;
  routes: Array<{ id: string; from: string; to: string }>;
  officeNote: string;
  customerNote: string;
  numPax: number;
  markupPerPerson: number;
  rawItinerary: string;
  flightSegments: unknown[];
  flightItineraryMode: "text" | "image";
  flightItineraryImage: string;
  holdLuggage: string;
  cabinLuggage: string;
  flightSectionEnabled: boolean;
  hotelSectionEnabled: boolean;
  visaSectionEnabled: boolean;
  transferSectionEnabled: boolean;
  officeNoteSectionEnabled: boolean;
  customerNoteSectionEnabled: boolean;
};

export type TQuotationCalculatorTypeState = {
  options: TQuotationOption[];
  activeOptionIndex: number;
};

export type TQuotationCalculatorTypeStates = Record<
  QuotationCalculatorType,
  TQuotationCalculatorTypeState
>;

export type TQuotationCreatorDto = {
  id: string;
  name: string;
};

export type TQuotationListItemDto = {
  id: string;
  referenceNumber: number;
  refId: string;
  readableId: string;
  calculatorType: QuotationCalculatorType;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerSource?: QuotationCustomerSource;
  quotationDate: string;
  makkahHotel: string;
  madinahHotel: string;
  status: QuotationStatus;
  completedOptionId?: string;
  completedOptionTitle?: string;
  deletedAt?: string;
  createdBy: TQuotationCreatorDto;
  totalValue?: number;
  currency: string;
};

export type TUpdateQuotationStatusBody = {
  status: QuotationStatus;
  /** Required when status is confirmed; must identify exactly one option. */
  completedOptionId?: string;
};

export type TQuotationDetailDto = TQuotationListItemDto & {
  customerNumber?: string;
  templateId: QuotationTemplateId;
  calculatorStates: TQuotationCalculatorTypeStates;
  options: TQuotationOption[];
};

export type TSaveQuotationBody = {
  id?: string;
  referenceNumber?: number;
  refId?: string;
  readableId?: string;
  customerName: string;
  customerNumber?: string;
  customerEmail?: string;
  customerSource?: QuotationCustomerSource | "";
  calculatorType: QuotationCalculatorType;
  quotationDate: string;
  status: QuotationStatus;
  currency: string;
  templateId: QuotationTemplateId;
  calculatorStates: TQuotationCalculatorTypeStates;
};
