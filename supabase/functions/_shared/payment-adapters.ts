import type {MerchantMethod,PaymentAdapter} from '../../../shared/payments.ts';
/** Empty intentionally: no merchant contract/signature implementation has been verified. */
export const paymentAdapters:Partial<Record<MerchantMethod,PaymentAdapter>>={};
