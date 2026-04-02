export type TrustedPurchaseGraphPurchaseEventRecord = {
  id: string;
  receiptId: string;
  sourceDocumentId: string;
  merchantId: string;
  merchantName: string;
  purchasedAt: string;
  grandTotal: number;
  currency: string;
  lineItemCount: number;
  thingCandidateCount: number;
  personIds: string[];
  memorySuggestionIds: string[];
  productCategories: string[];
};

export type TrustedPurchaseGraphMerchantRecord = {
  id: string;
  displayName: string;
  kind: 'retailer' | 'service_provider' | 'restaurant' | 'marketplace' | 'unknown';
  retailerProfile: string;
  purchaseCount: number;
  trustedSpendTotal: number;
  latestPurchaseAt: string;
  defaultProductCategories: string[];
};

export type TrustedPurchaseGraphLineItemRecord = {
  id: string;
  purchaseEventId: string;
  sourceLineItemId: string;
  description: string;
  quantity: number;
  lineTotal: number;
  category: string;
  subcategory: string;
  assetCandidateFlag: boolean;
  thingId?: string;
};

export type TrustedPurchaseGraphProductRecord = {
  id: string;
  purchaseEventId: string;
  sourceLineItemId: string;
  displayName: string;
  category: string;
  subcategory: string;
  thingCandidate: boolean;
  linkedThingId?: string;
  lineTotal: number;
};

export type TrustedPurchaseGraphThingRecord = {
  id: string;
  purchaseEventId: string;
  receiptId: string;
  displayName: string;
  category: string;
  subcategory: string;
  purchasePrice: number;
  acquiredAt: string;
  merchantName: string;
  personIds: string[];
  memoryIds: string[];
};

export type TrustedPurchaseGraphMemoryRecord = {
  id: string;
  purchaseEventId: string;
  receiptId: string;
  title: string;
  memoryType: string;
  significance: 'high' | 'medium' | 'light';
  startsAt: string;
  placeLabel: string;
  receiptIds: string[];
  personIds: string[];
  thingIds: string[];
};

export type TrustedPurchaseGraphRecord = {
  id: string;
  syncedAt: string;
  receiptId: string;
  sourceDocumentId: string;
  extractionRunId: string;
  purchaseEvent: TrustedPurchaseGraphPurchaseEventRecord;
  merchant: TrustedPurchaseGraphMerchantRecord;
  purchaseLineItems: TrustedPurchaseGraphLineItemRecord[];
  products: TrustedPurchaseGraphProductRecord[];
  things: TrustedPurchaseGraphThingRecord[];
  memories: TrustedPurchaseGraphMemoryRecord[];
};

export type TrustedPurchaseGraphUpsertRequest = {
  record: TrustedPurchaseGraphRecord;
};

export type TrustedPurchaseGraphUpsertResponse = {
  record: TrustedPurchaseGraphRecord;
};

export type TrustedPurchaseGraphListResponse = {
  records: TrustedPurchaseGraphRecord[];
};

export type TrustedPurchaseGraphGetResponse = {
  record: TrustedPurchaseGraphRecord;
};
