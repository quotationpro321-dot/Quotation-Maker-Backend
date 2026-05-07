/* eslint-disable @typescript-eslint/no-extraneous-class */
export class DateFormatter {
  static toUKFormat(dateString?: string): string {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);

    return `${day}/${month}/${year}`;
  }

  static getCurrentDate(): string {
    return this.toUKFormat(new Date().toISOString());
  }
}
