// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class InvoiceNumberGenerator {
  static generate(bookingId: string, createdAt: Date): string {
    const year = createdAt.getFullYear();
    const month = String(createdAt.getMonth() + 1).padStart(2, "0");
    const date = createdAt.getDate().toString().padStart(2, "0");
    // const id = bookingId.toString().slice(-6).toUpperCase();
    // return `${INVOICE_CONSTANTS.PREFIX}-${year}${month}${id}`;
    return `${year}${month}${date}`;
  }
}
