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
export type QuoteInclusion = string | { label: string; items: string[] };
export type QuotePresentation = {
  heroHeadline: string;
  heroSubheading: string;
  currencyNote: string;
};
export type QuoteAddon = {
  id: string;
  title: string;
  amountCents: number;
  details: string[];
};
export type QuoteData = {
  status?: "draft" | "issued";
  draftedOn?: string;
  quoteDate: string | null;
  validUntil: string | null;
  optionalAddons?: QuoteAddon[];
  phaseTwo?: {
    introduction: string;
    items: { name: string; amountCents: number }[];
  };
  draftChecks?: string[];
  currency: string;
  quoteId: string;
  preparedFor: string;
  site: string;
  preparedBy: string;
  presentation: QuotePresentation;
  scopeIntroduction: string;
  discountSummary: string;
  sections: QuoteSection[];
  inclusions: Record<string, QuoteInclusion[]>;
  terms: string[];
  hyperCare: string;
  warranty: string;
};
