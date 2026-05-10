export interface IMongooseMethod {
  comparePassword(plainTextPassword: string): Promise<boolean>;
  //   updateAvailability(): void;
}
