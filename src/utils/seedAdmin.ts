import { envVars } from "../config/env";
import { User } from "../modules/user/user.model";
import { IUser, Role } from "../modules/user/user.types";

export const seedSuperAdmin = async () => {
  try {
    const isAdminExist = await User.findOne({
      email: envVars.SUPER_ADMIN_EMAIL,
    });

    if (isAdminExist) {
      console.log("Admin Already Exists!");
      return;
    }

    console.log("Trying to create  Admin...");

    const payload: IUser = {
      name: "Super Admin",
      role: Role.SUPER_ADMIN,
      email: envVars.SUPER_ADMIN_EMAIL,
      password: envVars.SUPER_ADMIN_PASSWORD,
    };

    const admin = await User.create(payload);
    console.log(" Admin Created Successfully! \n");
    console.log(admin);
  } catch (error) {
    console.log(error);
  }
};
