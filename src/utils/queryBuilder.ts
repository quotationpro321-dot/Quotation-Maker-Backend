import { Query } from "mongoose";

class QueryBuilder<T> {
  public modelQuery: Query<T[], T>;
  public query: Record<string, unknown>;

  constructor(modelQuery: Query<T[], T>, query: Record<string, unknown>) {
    this.modelQuery = modelQuery;
    this.query = query;
  }

  search(searchableFields: string[]) {
    const searchTerm = this?.query?.searchTerm;
    if (searchTerm) {
      this.modelQuery = this.modelQuery.find({
        $or: searchableFields.map(
          (field) =>
            ({
              [field]: { $regex: searchTerm, $options: "i" },
            }) as Record<string, unknown>,
        ),
      });
    }

    return this;
  }

  filter() {
    const queryObj = { ...this.query };
    const excludeFields = ["searchTerm", "sort", "limit", "page", "fields"];
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    excludeFields.forEach((el) => delete queryObj[el]);

    // Convert CSV strings to arrays and apply $in
    Object.keys(queryObj).forEach((key) => {
      let value = queryObj[key];

      if (value === "true") value = true;
      if (value === "false") value = false;

      // Convert CSV string to array
      if (typeof value === "string" && value.includes(",")) {
        value = value.split(",").map((v) => v.trim());
      }

      // Apply $in for arrays
      if (Array.isArray(value)) {
        queryObj[key] = {
          $in: value.map((v) => new RegExp(`^${v}$`, "i")),
        };
      } else if (typeof value === "string") {
        queryObj[key] = { $regex: `^${value}$`, $options: "i" };
      } else {
        queryObj[key] = value;
      }
    });
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    excludeFields.forEach((el) => delete queryObj[el]);

    this.modelQuery = this.modelQuery.find(queryObj as Record<string, unknown>);
    return this;
  }

  sort() {
    const sort = (this?.query?.sort as string)?.split(",")?.join(" ") || "-createdAt";
    this.modelQuery = this.modelQuery.sort(sort as string);

    return this;
  }

  paginate() {
    const page = Number(this?.query?.page) || 1;
    const limit = Number(this?.query?.limit) || 10;
    const skip = (page - 1) * limit;

    this.modelQuery = this.modelQuery.skip(skip).limit(limit);

    return this;
  }

  fields() {
    const fields = (this?.query?.fields as string)?.split(",")?.join(" ") || "-__v";

    this.modelQuery = this.modelQuery.select(fields);
    return this;
  }

  populate(path: string, select?: string): this {
    this.modelQuery = this.modelQuery.populate(path, select);
    return this;
  }

  async countTotal() {
    const totalQueries = this.modelQuery.getFilter();
    const total = await this.modelQuery.model.countDocuments(totalQueries);
    const page = Number(this?.query?.page) || 1;
    const limit = Number(this?.query?.limit) || 10;
    const totalPage = Math.ceil(total / limit);

    return {
      page,
      limit,
      total,
      totalPage,
    };
  }
}

export default QueryBuilder;
