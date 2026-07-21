import z from "zod";

import {
  QuotationCalculatorType,
  QuotationStatus,
  QuotationTemplateId,
} from "./quotation.types";

const moneyField = z.coerce.number().min(0);

const quotationHotelSchema = z.object({
  name: z.string(),
  city: z.string(),
  country: z.string(),
  location: z.string(),
  areaSlug: z.string().optional(),
  distance: z.string(),
  checkIn: z.string(),
  checkOut: z.string(),
  roomType: z.string(),
  board: z.string(),
  cost: moneyField,
});

const quotationOptionSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  flightAdult: moneyField,
  flightYouth: moneyField,
  flightChild: moneyField,
  flightInfant: moneyField,
  hotels: z.array(quotationHotelSchema),
  visaUmrah: z.object({ pax: z.coerce.number(), cost: moneyField }),
  visaEVW: z.object({ pax: z.coerce.number(), cost: moneyField }),
  visaHoliday: z.object({ pax: z.coerce.number(), cost: moneyField }),
  transferCost: moneyField,
  includedServices: z.record(z.string(), z.boolean()),
  customIncludedServices: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      included: z.boolean(),
    }),
  ),
  vehicleName: z.string(),
  vehicleQuantity: z.coerce.number(),
  routes: z.array(
    z.object({
      id: z.string(),
      from: z.string(),
      to: z.string(),
    }),
  ),
  officeNote: z.string(),
  customerNote: z.string(),
  numPax: z.coerce.number().int().min(1),
  markupPerPerson: moneyField,
  rawItinerary: z.string().optional().default(""),
  flightSegments: z.array(z.unknown()).optional().default([]),
  flightItineraryMode: z.enum(["text", "image"]).optional().default("text"),
  flightItineraryImage: z.string().optional().default(""),
  holdLuggage: z.string().optional().default(""),
  cabinLuggage: z.string().optional().default(""),
  flightSectionEnabled: z.boolean().optional().default(true),
  hotelSectionEnabled: z.boolean().optional().default(true),
  visaSectionEnabled: z.boolean().optional().default(true),
  transferSectionEnabled: z.boolean().optional().default(true),
  officeNoteSectionEnabled: z.boolean().optional().default(true),
  customerNoteSectionEnabled: z.boolean().optional().default(true),
});

const calculatorTypeStateSchema = z.object({
  options: z.array(quotationOptionSchema).min(1),
  activeOptionIndex: z.coerce.number().int().min(0),
});

const calculatorStatesSchema = z.object({
  umrah: calculatorTypeStateSchema,
  holiday: calculatorTypeStateSchema,
  flights: calculatorTypeStateSchema,
});

export const saveQuotationBodySchema = z.object({
  id: z.string().trim().optional(),
  referenceNumber: z.coerce.number().int().positive().optional(),
  refId: z.string().trim().optional(),
  readableId: z.string().trim().optional(),
  customerName: z.string().trim().min(1, { message: "Customer name is required." }),
  customerNumber: z.string().trim().optional().default(""),
  calculatorType: z.nativeEnum(QuotationCalculatorType),
  quotationDate: z.string().trim().min(1),
  status: z.nativeEnum(QuotationStatus).default(QuotationStatus.DRAFT),
  currency: z.string().trim().min(1).default("GBP"),
  templateId: z.nativeEnum(QuotationTemplateId).default(QuotationTemplateId.CLASSIC),
  calculatorStates: calculatorStatesSchema,
});

export const listQuotationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(15),
  search: z.string().trim().max(120).optional(),
  status: z.nativeEnum(QuotationStatus).optional(),
  sortBy: z
    .enum([
      "referenceNumber",
      "refId",
      "calculatorType",
      "customerName",
      "quotationDate",
      "deletedAt",
      "status",
      "createdBy",
    ])
    .optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  createdById: z.string().trim().optional(),
});

export const quotationIdParamsSchema = z.object({
  id: z.string().trim().min(1, { message: "Quotation id is required." }),
});

export const updateQuotationStatusBodySchema = z
  .object({
    status: z.nativeEnum(QuotationStatus),
    completedOptionId: z.string().trim().min(1).optional(),
  })
  .superRefine((value, context) => {
    if (value.status === QuotationStatus.CONFIRMED && !value.completedOptionId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["completedOptionId"],
        message: "Select the completed option when confirming a quotation.",
      });
    }

    if (value.status !== QuotationStatus.CONFIRMED && value.completedOptionId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["completedOptionId"],
        message: "Completed option is only allowed for confirmed quotations.",
      });
    }
  });

export type TListQuotationsQuery = z.infer<typeof listQuotationsQuerySchema>;
export type TSaveQuotationBody = z.infer<typeof saveQuotationBodySchema>;
export type TUpdateQuotationStatusBody = z.infer<typeof updateQuotationStatusBodySchema>;
