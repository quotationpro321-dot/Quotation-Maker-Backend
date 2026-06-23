import type { Types } from "mongoose";

import type { IQuotation } from "./quotation.model";
import {
  QuotationCalculatorType,
  type TQuotationCalculatorTypeState,
  type TQuotationDetailDto,
  type TQuotationHotel,
  type TQuotationListItemDto,
  type TQuotationOption,
} from "./quotation.types";

function hasHotelStayContent(hotel: TQuotationHotel): boolean {
  return Boolean(
    hotel.name ||
      hotel.location ||
      hotel.checkIn ||
      hotel.checkOut ||
      hotel.roomType ||
      hotel.board,
  );
}

function calculateHotelTotal(option: TQuotationOption): number {
  return option.hotels.reduce((total, hotel) => total + (hotel.cost ?? 0), 0);
}

function calculateVisaTotal(option: TQuotationOption): number {
  return (
    option.visaUmrah.pax * option.visaUmrah.cost +
    option.visaEVW.pax * option.visaEVW.cost +
    option.visaHoliday.pax * option.visaHoliday.cost
  );
}

export function calculateOptionTotalValue(option: TQuotationOption): number {
  const hotelTotal = option.hotelSectionEnabled ? calculateHotelTotal(option) : 0;
  const visaTotal = option.visaSectionEnabled ? calculateVisaTotal(option) : 0;
  const transferCost = option.transferSectionEnabled ? option.transferCost : 0;
  const serviceTotal = hotelTotal + visaTotal + transferCost;
  const flightTotal = option.flightSectionEnabled
    ? option.flightAdult +
      option.flightYouth +
      option.flightChild +
      option.flightInfant
    : 0;
  const totalMarkup = option.numPax * option.markupPerPerson;

  return serviceTotal + flightTotal + totalMarkup;
}

function findHotelNameByAreaSlug(
  option: TQuotationOption,
  areaSlug: "makkah" | "madinah",
): string | undefined {
  const match = option.hotels.find(
    (hotel) => hotel.areaSlug === areaSlug && hasHotelStayContent(hotel),
  );
  return match?.name?.trim() || undefined;
}

function deriveHotelNames(option: TQuotationOption | undefined): {
  makkahHotel: string;
  madinahHotel: string;
} {
  if (!option) {
    return { makkahHotel: "—", madinahHotel: "—" };
  }

  const filledHotels = option.hotels.filter(hasHotelStayContent);
  const makkahHotel =
    findHotelNameByAreaSlug(option, "makkah") ?? filledHotels[0]?.name?.trim() ?? "—";
  const madinahHotel =
    findHotelNameByAreaSlug(option, "madinah") ??
    filledHotels.find((hotel) => hotel.name?.trim() && hotel.name !== makkahHotel)?.name?.trim() ??
    filledHotels[1]?.name?.trim() ??
    "—";

  return { makkahHotel, madinahHotel };
}

function getActiveCalculatorState(
  quotation: Pick<IQuotation, "calculatorType" | "calculatorStates">,
): TQuotationCalculatorTypeState | undefined {
  const calculatorType = quotation.calculatorType ?? QuotationCalculatorType.UMRAH;
  return quotation.calculatorStates?.[calculatorType];
}

export function getActiveOptions(
  quotation: Pick<IQuotation, "calculatorType" | "calculatorStates">,
): TQuotationOption[] {
  return getActiveCalculatorState(quotation)?.options ?? [];
}

type TPopulatedCreator = {
  _id: Types.ObjectId;
  userId?: string;
  name: string;
};

export function toCreatorDto(creator: TPopulatedCreator) {
  return {
    id: creator.userId ?? String(creator._id),
    name: creator.name,
  };
}

export function getQuotationTotalValue(
  quotation: Pick<IQuotation, "calculatorType" | "calculatorStates">,
): number {
  const firstOption = getActiveOptions(quotation)[0];
  return firstOption ? calculateOptionTotalValue(firstOption) : 0;
}

export function toQuotationListItemDto(
  quotation: IQuotation & { _id: Types.ObjectId; createdBy: TPopulatedCreator },
): TQuotationListItemDto {
  const activeState = getActiveCalculatorState(quotation);
  const firstOption = activeState?.options?.[0];
  const { makkahHotel, madinahHotel } = deriveHotelNames(firstOption);

  return {
    id: String(quotation._id),
    referenceNumber: quotation.referenceNumber,
    customerName: quotation.customerName,
    customerPhone: quotation.customerNumber || undefined,
    quotationDate: quotation.quotationDate.toISOString(),
    makkahHotel,
    madinahHotel,
    status: quotation.status,
    createdBy: toCreatorDto(quotation.createdBy),
    totalValue: firstOption ? calculateOptionTotalValue(firstOption) : undefined,
    currency: quotation.currency,
  };
}

export function toQuotationDetailDto(
  quotation: IQuotation & { _id: Types.ObjectId; createdBy: TPopulatedCreator },
): TQuotationDetailDto {
  const listItem = toQuotationListItemDto(quotation);
  const options = getActiveOptions(quotation);

  return {
    ...listItem,
    customerNumber: quotation.customerNumber || undefined,
    calculatorType: quotation.calculatorType,
    templateId: quotation.templateId,
    calculatorStates: quotation.calculatorStates,
    options,
  };
}
