import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";

import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../utils/AppError";
import { User } from "../user/user.model";
import { UserRole } from "../user/user.types";
import { getNextReferenceNumber } from "./quotation-counter.model";
import { createQuotationIdentity } from "./quotation-id.utils";
import { Quotation, type IQuotation } from "./quotation.model";
import {
  getActiveOptions,
  toQuotationDetailDto,
  toQuotationListItemDto,
} from "./quotation-projection.utils";
import {
  QuotationStatus,
  type TSaveQuotationBody,
  type TUpdateQuotationStatusBody,
} from "./quotation.types";
import type { TListQuotationsQuery } from "./quotation.validation";

type TPopulatedQuotation = IQuotation & {
  _id: Types.ObjectId;
  createdBy: {
    _id: Types.ObjectId;
    userId?: string;
    name: string;
  };
};

const CREATOR_POPULATE = { path: "createdBy", select: "userId name" };

function toBuilderQuery(query: TListQuotationsQuery): Record<string, unknown> {
  const { search, sortBy, sortOrder, createdById: _createdById, ...rest } = query;
  const prepared: Record<string, unknown> = { ...rest };

  if (search) prepared.searchTerm = search;

  const sortField =
    sortBy === "createdBy"
      ? "createdAt"
      : sortBy ?? "quotationDate";

  prepared.sort = sortOrder === "asc" ? sortField : `-${sortField}`;
  return prepared;
}

async function resolveUserObjectId(userId: string): Promise<Types.ObjectId | null> {
  if (Types.ObjectId.isValid(userId)) {
    const byId = await User.findById(userId).select("_id").lean();
    if (byId?._id) return byId._id;
  }

  const byUserId = await User.findOne({ userId }).select("_id").lean();
  return byUserId?._id ?? null;
}

async function resolveActorObjectId(userId: string): Promise<Types.ObjectId> {
  const objectId = await resolveUserObjectId(userId);
  if (!objectId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Authenticated user not found.");
  }
  return objectId;
}

function assertQuotationAccess(
  quotation: TPopulatedQuotation,
  actorUserId: string,
  actorRole: string,
) {
  if (actorRole === UserRole.ADMIN) return;

  if (String(quotation.createdBy._id) !== actorUserId) {
    throw new AppError(StatusCodes.FORBIDDEN, "You are not permitted to access this quotation.");
  }
}

async function findPopulatedQuotation(
  id: string,
  includeDeleted = false,
): Promise<TPopulatedQuotation> {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid quotation id.");
  }

  const filter: Record<string, unknown> = { _id: id };
  if (!includeDeleted) filter.deletedAt = null;

  const quotation = await Quotation.findOne(filter)
    .populate(CREATOR_POPULATE)
    .lean<TPopulatedQuotation>();
  if (!quotation) {
    throw new AppError(StatusCodes.NOT_FOUND, "Quotation not found.");
  }

  return quotation;
}

function buildQuotationDocument(body: TSaveQuotationBody) {
  return {
    customerName: body.customerName.trim(),
    customerNumber: body.customerNumber?.trim() ?? "",
    calculatorType: body.calculatorType,
    quotationDate: new Date(body.quotationDate),
    status: body.status,
    currency: body.currency.trim() || "GBP",
    templateId: body.templateId,
    calculatorStates: body.calculatorStates,
  };
}

function resolveCompletedOption(
  quotation: Pick<IQuotation, "calculatorType" | "calculatorStates">,
  completedOptionId: string,
) {
  const options = getActiveOptions(quotation);
  const optionIndex = options.findIndex((option) => option.id === completedOptionId);

  if (optionIndex < 0) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Completed option must be one of this quotation's options.",
    );
  }

  return { option: options[optionIndex], optionIndex };
}

export const quotationsService = {
  list: async (query: TListQuotationsQuery, actorUserId?: string) => {
    const baseFilter: Record<string, unknown> = { deletedAt: null };

    if (actorUserId) {
      baseFilter.createdBy = await resolveActorObjectId(actorUserId);
    } else if (query.createdById) {
      const creatorId = await resolveUserObjectId(query.createdById);
      if (creatorId) {
        baseFilter.createdBy = creatorId;
      }
    }

    const quotationQuery = new QueryBuilder(Quotation.find(baseFilter), toBuilderQuery(query))
      .search(["customerName", "customerNumber", "refId", "readableId"])
      .filter()
      .sort()
      .paginate()
      .populate(CREATOR_POPULATE.path, CREATOR_POPULATE.select);

    const [items, meta] = await Promise.all([
      quotationQuery.modelQuery.lean<TPopulatedQuotation[]>(),
      quotationQuery.countTotal(),
    ]);

    return {
      items: items.map(toQuotationListItemDto),
      pagination: {
        page: meta.page,
        limit: meta.limit,
        total: meta.total,
        totalPages: meta.totalPage,
      },
    };
  },

  listDeleted: async (query: TListQuotationsQuery) => {
    const quotationQuery = new QueryBuilder(
      Quotation.find({ deletedAt: { $ne: null } }),
      toBuilderQuery(query),
    )
      .search(["customerName", "customerNumber", "refId", "readableId"])
      .filter()
      .sort()
      .paginate()
      .populate(CREATOR_POPULATE.path, CREATOR_POPULATE.select);

    const [items, meta] = await Promise.all([
      quotationQuery.modelQuery.lean<TPopulatedQuotation[]>(),
      quotationQuery.countTotal(),
    ]);

    return {
      items: items.map(toQuotationListItemDto),
      pagination: {
        page: meta.page,
        limit: meta.limit,
        total: meta.total,
        totalPages: meta.totalPage,
      },
    };
  },

  getById: async (id: string, actorUserId: string, actorRole: string) => {
    const quotation = await findPopulatedQuotation(id);
    assertQuotationAccess(quotation, actorUserId, actorRole);
    return toQuotationListItemDto(quotation);
  },

  getFullById: async (id: string, actorUserId: string, actorRole: string) => {
    const quotation = await findPopulatedQuotation(id);
    assertQuotationAccess(quotation, actorUserId, actorRole);
    return toQuotationDetailDto(quotation);
  },

  create: async (body: TSaveQuotationBody, actorUserId: string) => {
    const createdBy = await resolveActorObjectId(actorUserId);
    const referenceNumber = await getNextReferenceNumber();
    const identity = createQuotationIdentity({
      calculatorType: body.calculatorType,
      templateId: body.templateId,
      referenceNumber,
    });

    const quotation = await Quotation.create({
      referenceNumber,
      ...identity,
      ...buildQuotationDocument(body),
      createdBy,
    });

    const populated = await Quotation.findById(quotation._id)
      .populate(CREATOR_POPULATE)
      .lean<TPopulatedQuotation>();

    if (!populated) {
      throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, "Could not load saved quotation.");
    }

    return toQuotationDetailDto(populated);
  },

  update: async (
    id: string,
    body: TSaveQuotationBody,
    actorUserId: string,
    actorRole: string,
  ) => {
    const existing = await findPopulatedQuotation(id);
    assertQuotationAccess(existing, actorUserId, actorRole);

    const document = buildQuotationDocument(body);
    const patch: Record<string, unknown> = { ...document };

    if (body.status !== QuotationStatus.CONFIRMED) {
      patch.completedOptionId = null;
    }

    const updated = await Quotation.findByIdAndUpdate(id, patch, { new: true })
      .populate(CREATOR_POPULATE)
      .lean<TPopulatedQuotation>();

    if (!updated) {
      throw new AppError(StatusCodes.NOT_FOUND, "Quotation not found.");
    }

    return toQuotationDetailDto(updated);
  },

  updateStatus: async (
    id: string,
    body: TUpdateQuotationStatusBody,
    actorUserId: string,
    actorRole: string,
  ) => {
    const existing = await findPopulatedQuotation(id);
    assertQuotationAccess(existing, actorUserId, actorRole);

    const patch: Record<string, unknown> = {
      status: body.status,
    };

    if (body.status === QuotationStatus.CONFIRMED) {
      const completedOptionId = body.completedOptionId?.trim();
      if (!completedOptionId) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Select the completed option when confirming a quotation.",
        );
      }

      const { optionIndex } = resolveCompletedOption(existing, completedOptionId);
      const calculatorStates = structuredClone(existing.calculatorStates);
      const activeState = calculatorStates[existing.calculatorType];
      if (!activeState) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Quotation options are missing for the active quotation type.",
        );
      }

      activeState.activeOptionIndex = optionIndex;
      patch.completedOptionId = completedOptionId;
      patch.calculatorStates = calculatorStates;
    } else {
      patch.completedOptionId = null;
    }

    const updated = await Quotation.findByIdAndUpdate(id, patch, { new: true })
      .populate(CREATOR_POPULATE)
      .lean<TPopulatedQuotation>();

    if (!updated) {
      throw new AppError(StatusCodes.NOT_FOUND, "Quotation not found.");
    }

    return toQuotationDetailDto(updated);
  },

  remove: async (id: string, actorUserId: string, actorRole: string) => {
    const existing = await findPopulatedQuotation(id);
    assertQuotationAccess(existing, actorUserId, actorRole);
    await Quotation.findByIdAndUpdate(id, { deletedAt: new Date() });
  },

  restore: async (id: string) => {
    const existing = await findPopulatedQuotation(id, true);
    if (!existing.deletedAt) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Quotation is not in the bin.");
    }

    const restored = await Quotation.findByIdAndUpdate(
      id,
      { deletedAt: null },
      { new: true },
    )
      .populate(CREATOR_POPULATE)
      .lean<TPopulatedQuotation>();

    if (!restored) {
      throw new AppError(StatusCodes.NOT_FOUND, "Deleted quotation not found.");
    }

    return toQuotationListItemDto(restored);
  },
};
