import bcrypt from "bcryptjs";
import mongoose, { Model } from "mongoose";
import { envVars } from "../../config/env";
import { IMongooseMethod } from "../../types/method";
import { IUser, UserRole, UserStatus } from "./user.types";

const userSchema = new mongoose.Schema<IUser, Model<IUser>, IMongooseMethod>(
  {
    userId: {type: String, unique: true, required: true},
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    emailVerified: { type: Boolean, default: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.EMPLOYEE,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.ACTIVE,
      required: true,
    },
    passwordChangedAt: { type: Date },
    passwordResetTokenHash: { type: String, default: null },
    passwordResetExpiresAt: { type: Date, default: null },
    passwordResetUsedAt: { type: Date, default: null },
    profilePhotoUrl: {
      type: String,
    },
    profilePhotoPublicId: { type: String, default: undefined },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

userSchema.pre("save", async function () {
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(Number(envVars.BCRYPT_SALT_ROUNDS));
    this.password = await bcrypt.hash(this.password, salt);
    this.passwordChangedAt = new Date();
  }
});

userSchema.pre("findOneAndUpdate", async function () {
  const update = this.getUpdate() as Partial<IUser>;
  if (update.password) {
    const salt = await bcrypt.genSalt(Number(envVars.BCRYPT_SALT_ROUNDS));
    update.password = await bcrypt.hash(update.password, salt);
    update.passwordChangedAt = new Date();
    this.setUpdate(update);
  }
});

userSchema.method("comparePassword", async function (plainTextPassword: string) {
  return await bcrypt.compare(plainTextPassword, this.password);
});

userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

export const User = mongoose.model("User", userSchema);
