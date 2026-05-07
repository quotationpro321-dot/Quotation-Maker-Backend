import bcrypt from "bcryptjs";
import mongoose, { Model } from "mongoose";
import { envVars } from "../../config/env";
import { IMongooseMethod } from "../../types/method";
import { IUser, Role } from "./user.types";

const userSchema = new mongoose.Schema<IUser, Model<IUser>, IMongooseMethod>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: Object.values(Role),
      required: true,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

userSchema.pre("save", async function () {
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(Number(envVars.BCRYPT_SALT_ROUND));
    this.password = await bcrypt.hash(this.password, salt);
  }
});

userSchema.pre("findOneAndUpdate", async function () {
  const update = this.getUpdate() as Partial<IUser>;
  if (update.password) {
    const salt = await bcrypt.genSalt(Number(envVars.BCRYPT_SALT_ROUND));
    update.password = await bcrypt.hash(update.password, salt);
    this.setUpdate(update);
  }
});

userSchema.method("comparePassword", async function (realPassword) {
  return await bcrypt.compare(realPassword, this.password);
});

userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

export const User = mongoose.model("User", userSchema);
