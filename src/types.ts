export type QuoteItem = { name: string; quantity: number; unitCents: number };
export type QuoteDiscount = {
  label: string;
  quantity: number;
  unitCents: number;
};
export type QuoteSection = {
  id: string;
  title: string;
  items: QuoteItem[];
  discount: QuoteDiscount | null;
  interimSubtotal: {
    afterItemCount: number;
    label: string;
    amountCents: number;
  } | null;
  grossSubtotal: { label: string; amountCents: number } | null;
  finalLabel: string | null;
};
export type QuoteData = {
  currency: string;
  quoteId: string;
  preparedFor: string;
  site: string;
  quoteDate: string;
  validUntil: string;
  preparedBy: string;
  scopeIntroduction: string;
  discountSummary: string;
  sections: QuoteSection[];
  inclusions: Record<string, string[]>;
  terms: string[];
  hyperCare: string;
  warranty: string;
  signing: string;
};
