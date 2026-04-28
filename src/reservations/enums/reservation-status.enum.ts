export enum ReservationStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT', // منتظر پرداخت
  CONFIRMED = 'CONFIRMED', // تایید شده
  CHECKED_IN = 'CHECKED_IN', // چک‌این شده
  CHECKED_OUT = 'CHECKED_OUT', // چک‌اوت شده
  CANCELLED = 'CANCELLED', // لغو شده
  EXPIRED = 'EXPIRED', // منقضی شده (پرداخت نشده)
}
