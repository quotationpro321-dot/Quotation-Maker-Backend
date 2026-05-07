export enum Role {
  ADMIN = "admin",
  SUPER_ADMIN = "superAdmin",
  USER = "user",
}

export interface IUser {
  _id?: string;
  name: string;
  email: string;
  password: string;
  role: Role;
}
