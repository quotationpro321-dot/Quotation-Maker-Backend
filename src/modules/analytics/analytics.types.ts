/* eslint-disable @typescript-eslint/no-explicit-any */
export interface IAnalytics {
  eventName: string;
  eventType: "PageView" | "FormSubmit" | "Booking" | "Contact" | "Custom";
  page?: string;
  referrer?: string;
  userAgent?: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
}

export enum AnalyticsEventType {
  PAGE_VIEW = "PageView",
  FORM_SUBMIT = "FormSubmit",
  BOOKING = "Booking",
  CONTACT = "Contact",
  CUSTOM = "Custom",
}
