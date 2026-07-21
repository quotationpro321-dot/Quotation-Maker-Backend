import { randomUUID } from "node:crypto";

import { COMPANY_INFO } from "../../constants/company.constant";
import {
  QuotationCalculatorType,
  QuotationTemplateId,
} from "./quotation.types";

const COMPANY_CODE = "AS";
const REFERENCE_DIGIT_COUNT = 6;

type TBrandMeta = {
  displayName: string;
  code: string;
};

const CALCULATOR_TYPE_CODES: Record<QuotationCalculatorType, string> = {
  [QuotationCalculatorType.UMRAH]: "UM",
  [QuotationCalculatorType.HOLIDAY]: "HL",
  [QuotationCalculatorType.FLIGHTS]: "FL",
};

const TEMPLATE_BRAND_BY_CALCULATOR: Record<
  QuotationCalculatorType,
  Record<QuotationTemplateId, TBrandMeta>
> = {
  [QuotationCalculatorType.UMRAH]: {
    [QuotationTemplateId.CLASSIC]: { displayName: "Alsama", code: "AS" },
    [QuotationTemplateId.MODERN]: { displayName: "Agent 1", code: "A1" },
    [QuotationTemplateId.COMPACT]: { displayName: "Agent 2", code: "A2" },
  },
  [QuotationCalculatorType.HOLIDAY]: {
    [QuotationTemplateId.CLASSIC]: { displayName: "Sky Guru", code: "SG" },
    [QuotationTemplateId.MODERN]: { displayName: "Agent 1", code: "A1" },
    [QuotationTemplateId.COMPACT]: { displayName: "Agent 2", code: "A2" },
  },
  [QuotationCalculatorType.FLIGHTS]: {
    [QuotationTemplateId.CLASSIC]: { displayName: "Sky Guru", code: "SG" },
    [QuotationTemplateId.MODERN]: { displayName: "Agent 1", code: "A1" },
    [QuotationTemplateId.COMPACT]: { displayName: "Agent 2", code: "A2" },
  },
};

export function getTemplateBrandMeta(
  calculatorType: QuotationCalculatorType,
  templateId: QuotationTemplateId,
): TBrandMeta {
  return TEMPLATE_BRAND_BY_CALCULATOR[calculatorType][templateId];
}

export function buildQuotationRefId(
  calculatorType: QuotationCalculatorType,
  templateId: QuotationTemplateId,
  referenceNumber: number,
): string {
  const brand = getTemplateBrandMeta(calculatorType, templateId);
  const typeCode = CALCULATOR_TYPE_CODES[calculatorType];
  const sequence = String(referenceNumber).padStart(REFERENCE_DIGIT_COUNT, "0");
  return `${COMPANY_CODE}${brand.code}${typeCode}${sequence}`;
}

export function buildQuotationReadableId(
  calculatorType: QuotationCalculatorType,
  templateId: QuotationTemplateId,
  uuid: string = randomUUID(),
): string {
  const brand = getTemplateBrandMeta(calculatorType, templateId);
  return `${COMPANY_INFO.name} > ${brand.displayName} > ${calculatorType} ${uuid}`;
}

export function createQuotationIdentity(params: {
  calculatorType: QuotationCalculatorType;
  templateId: QuotationTemplateId;
  referenceNumber: number;
}): { refId: string; readableId: string } {
  const uuid = randomUUID();
  return {
    refId: buildQuotationRefId(
      params.calculatorType,
      params.templateId,
      params.referenceNumber,
    ),
    readableId: buildQuotationReadableId(
      params.calculatorType,
      params.templateId,
      uuid,
    ),
  };
}
