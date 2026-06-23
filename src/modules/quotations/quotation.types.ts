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

export type TQuotationOption = {
  id: string;
  title: string;
  flightAdult: number;
  flightYouth: number;
  flightChild: number;
  flightInfant: number;
  hotels: TQuotationHotel[];
  visaUmrah: { pax: number; cost: number };
  visaEVW: { pax: number; cost: number };
  visaHoliday: { pax: number; cost: number };
  transferCost: number;
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
  customerName: string;
  customerPhone?: string;
  quotationDate: string;
  makkahHotel: string;
  madinahHotel: string;
  status: QuotationStatus;
  createdBy: TQuotationCreatorDto;
  totalValue?: number;
  currency: string;
};

export type TQuotationDetailDto = TQuotationListItemDto & {
  customerNumber?: string;
  calculatorType: QuotationCalculatorType;
  templateId: QuotationTemplateId;
  calculatorStates: TQuotationCalculatorTypeStates;
  options: TQuotationOption[];
};

export type TSaveQuotationBody = {
  id?: string;
  referenceNumber?: number;
  customerName: string;
  customerNumber?: string;
  calculatorType: QuotationCalculatorType;
  quotationDate: string;
  status: QuotationStatus;
  currency: string;
  templateId: QuotationTemplateId;
  calculatorStates: TQuotationCalculatorTypeStates;
};
