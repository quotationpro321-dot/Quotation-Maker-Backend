import { envVars } from "../config/env";
import { User } from "../modules/user/user.model";
import { IUser, UserRole, UserStatus } from "../modules/user/user.types";

export const seedAdmin = async () => {
  try {
    const existingAdmin = await User.findOne({
      email: envVars.ADMIN_EMAIL,
    });

    if (existingAdmin) {
      console.log("Admin Already Exists!");
      return;
    }

    console.log("Trying to create  Admin...");

    const payload: IUser = {
      userId: envVars.ADMIN_NAME + envVars.ADMIN_EMAIL + UserRole.ADMIN,
      name: envVars.ADMIN_NAME,
      role: UserRole.ADMIN,
      email: envVars.ADMIN_EMAIL,
      password: envVars.ADMIN_PASSWORD,
      status: UserStatus.ACTIVE,
    };

    const admin = await User.create(payload);
    console.log(" Admin Created Successfully! \n");
    console.log(admin);
  } catch (error) {
    console.log(error);
  }
};
