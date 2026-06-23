export type TTransferLocationDto = {
  id: string;
  slug: string;
  name: string;
  calculatorType: "umrah" | "holiday";
  sortOrder: number;
  isActive: boolean;
};
