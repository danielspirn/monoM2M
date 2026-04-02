import {
  listProjectedEvidenceRecords,
  answerSemanticReceiptQuestion,
  getLiveReceiptStudioPayload,
  hasLiveReceipt,
  listProjectedLocations,
  listProjectedPolicies,
  listProjectedExtractionRuns,
  listLiveReceiptCards,
  listProjectedReturnSupports,
  listProjectedSourceDocuments,
  listProjectedSemanticRecords,
  listProjectedTags,
  listProjectedMemories,
  listProjectedMerchants,
  listProjectedObjects,
  listProjectedDocumentLinks,
  listProjectedPurchaseEvents,
  listProjectedPurchaseLineItems,
  listProjectedPurchaseParticipants,
  listProjectedProducts,
  listProjectedThingDocuments,
  listProjectedThings,
  listProjectedWarranties,
} from './receiptWorkflowStore';

type Tone = 'blue' | 'green' | 'amber';

type ReceiptRecord = {
  id: string;
  merchantName: string;
  purchasedAt: string;
  grandTotal: number;
  currency: string;
  lineItemCount: number;
  status: 'needs_review' | 'trusted';
  note: string;
  lineHighlights: string[];
  thingIds: string[];
  personIds: string[];
  memoryIds: string[];
  category: string;
  returnWindowEndsAt?: string;
};

type ThingRecord = {
  id: string;
  displayName: string;
  category: string;
  subcategory: string;
  status: 'active' | 'recent' | 'consumed';
  purchasePrice: number;
  currency: string;
  acquiredAt: string;
  merchantName: string;
  receiptId: string;
  notes: string;
  sourceDocumentId?: string;
  warrantyEndsAt?: string;
  returnWindowEndsAt?: string;
  badgeLabels: string[];
  supportLabels?: string[];
  linkedDocumentCount?: number;
  personIds: string[];
  memoryIds: string[];
};

type PersonRecord = {
  id: string;
  displayName: string;
  relationshipType: string;
  tags: string[];
  notes: string;
  linkedReceiptIds: string[];
  linkedThingIds: string[];
  linkedMemoryIds: string[];
};

type MemoryRecord = {
  id: string;
  title: string;
  suggestedTitle?: string;
  memoryState: 'candidate' | 'confirmed';
  memoryType: string;
  significance: 'high' | 'medium' | 'light';
  startsAt: string;
  endsAt?: string;
  placeLabel: string;
  summary: string;
  notes: string;
  receiptIds: string[];
  personIds: string[];
  thingIds: string[];
};

type RouteBuilderOptions = {
  personaId?: string;
  state?: string;
  params?: Record<string, string>;
};

export type SummaryMetric = {
  label: string;
  value: string;
  note: string;
  tone: Tone;
  trend: number[];
};

export type EntityAction = {
  label: string;
  action: string;
  icon?: string;
  suggestedPrompt?: string;
};

export type ReceiptCardData = {
  id: string;
  merchantName: string;
  purchasedAt: string;
  grandTotal: number;
  currency: string;
  lineItemCount: number;
  status: string;
  note: string;
  tags: string[];
  action: string;
};

export type ThingCardData = {
  id: string;
  displayName: string;
  category: string;
  subcategory: string;
  merchantName: string;
  purchasePrice: number;
  currency: string;
  acquiredAt: string;
  badges: string[];
  note: string;
  linkedPeople: string[];
  linkedMemories: string[];
  action: string;
};

export type PersonCardData = {
  id: string;
  displayName: string;
  relationshipType: string;
  tags: string[];
  linkedPurchaseCount: number;
  linkedThingCount: number;
  linkedMemoryCount: number;
  totalSpend: number;
  note: string;
  action: string;
};

export type MemoryCardData = {
  id: string;
  title: string;
  memoryState: string;
  memoryType: string;
  significance: string;
  startsAt: string;
  placeLabel: string;
  summary: string;
  peoplePreview: string[];
  linkedThingCount: number;
  linkedReceiptCount: number;
  action: string;
};

export type ActivityItem = {
  id: string;
  title: string;
  body: string;
  occurredAt: string;
  kind: 'receipt' | 'thing' | 'person' | 'memory';
  action: string;
};

export type ReminderCard = {
  id: string;
  title: string;
  body: string;
  tone: Tone;
  actionLabel: string;
  action: string;
};

export type HomePayload = {
  header: { title: string; searchPlaceholder: string };
  hero: {
    headline: string;
    body: string;
    primaryCta: EntityAction;
    secondaryCta: EntityAction;
  };
  summaryMetrics: SummaryMetric[];
  continueCard: {
    title: string;
    body: string;
    actionLabel: string;
    action: string;
  } | null;
  reminders: ReminderCard[];
  recentActivity: ActivityItem[];
  recentReceipts: ReceiptCardData[];
  topThings: ThingCardData[];
  topPeople: PersonCardData[];
  recentMemories: MemoryCardData[];
  upgradeCard: UpgradeCardData | null;
};

export type ThingsPayload = {
  header: {
    title: string;
    viewOptions: string[];
    selectedView: string;
    searchPlaceholder: string;
    filterLabel: string;
    sortLabel: string;
  };
  actionStrip: string[];
  summaryMetrics: SummaryMetric[];
  visualization: {
    type: 'treemap';
    series: Array<{ id: string; label: string; value: number }>;
  } | null;
  categories: Array<{ id: string; label: string; thingCount: number; spend: number }>;
  things: ThingCardData[];
  highlightedThingIds: string[];
  upgradeCard: UpgradeCardData | null;
};

export type ThingDetailPayload = {
  detail: {
    id: string;
    title: string;
    category: string;
    purchasePrice: number;
    currency: string;
    acquiredAt: string;
    merchantName: string;
    notes: string;
    badges: string[];
    supportLabels: string[];
    headerSummary: string;
  };
  product: {
    title: string;
    matchStatus: string;
    confidenceLabel: string;
    category: string;
    note: string;
  } | null;
  warranty: {
    providerName: string;
    coverageType: string;
    endsAt: string;
    status: string;
    note: string;
  } | null;
  returnSupport: {
    policyLabel: string;
    windowEndsAt: string;
    status: string;
    note: string;
  } | null;
  policies: Array<{
    id: string;
    policyKind: string;
    title: string;
    providerName: string;
    status: string;
    effectiveLabel: string;
    linkedSupportLabel: string;
    note: string;
  }>;
  locations: Array<{
    id: string;
    label: string;
    locationKind: string;
    relationshipLabel: string;
    note: string;
  }>;
  evidenceLinks: Array<{
    id: string;
    label: string;
    evidenceType: string;
    snippet: string;
    note: string;
  }>;
  documents: Array<{
    id: string;
    title: string;
    documentRole: string;
    documentType: string;
  }>;
  documentLinks: Array<{
    id: string;
    targetObjectType: string;
    targetLabel: string;
    documentRole: string;
    note: string;
  }>;
  tagGraph: Array<{
    id: string;
    framework: string;
    label: string;
    linkageCount: string;
    spendLabel: string;
    note: string;
  }>;
  retrievalProfile: {
    scope: string;
    embeddingVersion: string;
    keywordCount: string;
    termCount: string;
    preview: string;
  } | null;
  provenance: {
    sourceLabel: string;
    captureLabel: string;
    fileCountLabel: string;
    providerLabel: string;
    parserLabel: string;
    statusLabel: string;
    note: string;
  } | null;
  merchant: {
    title: string;
    retailerProfile: string;
    kind: string;
    purchaseCount: string;
    spendLabel: string;
    defaultCategories: string[];
    note: string;
  } | null;
  object: {
    title: string;
    category: string;
    householdTags: string[];
    lemTags: string[];
    purchaseCount: string;
    spendLabel: string;
    note: string;
  } | null;
  metadata: Array<{ label: string; value: string }>;
  purchaseSource: ReceiptCardData | null;
  linkedPeople: PersonCardData[];
  linkedMemories: MemoryCardData[];
  relatedThings: ThingCardData[];
  activity: ActivityItem[];
  upgradeCard: UpgradeCardData | null;
};

export type PeoplePayload = {
  header: {
    title: string;
    viewOptions: string[];
    selectedView: string;
    searchPlaceholder: string;
    filterLabel: string;
  };
  actionStrip: string[];
  summaryMetrics: SummaryMetric[];
  network: {
    rings: Array<{
      label: string;
      count: number;
      nodes: Array<{ id: string; label: string; relationshipType: string }>;
    }>;
  } | null;
  spotlight: {
    title: string;
    body: string;
    actionLabel: string;
    action: string;
  } | null;
  people: PersonCardData[];
  upgradeCard: UpgradeCardData | null;
};

export type PersonDetailPayload = {
  detail: {
    id: string;
    title: string;
    relationshipType: string;
    notes: string;
    tags: string[];
    headerSummary: string;
  };
  summaryMetrics: SummaryMetric[];
  purchaseParticipation: {
    roles: string[];
    linkedLineItemCount: number;
    linkedThingCount: number;
    linkedMemoryCount: number;
    spendLabel: string;
    note: string;
  } | null;
  associatedThings: ThingCardData[];
  associatedMemories: MemoryCardData[];
  relatedReceipts: ReceiptCardData[];
  activity: ActivityItem[];
};

export type MemoriesPayload = {
  header: {
    title: string;
    viewOptions: string[];
    selectedView: string;
    searchPlaceholder: string;
    filterLabel: string;
  };
  actionStrip: string[];
  summaryMetrics: SummaryMetric[];
  featuredMemory: MemoryCardData | null;
  timeline: MemoryCardData[];
  upgradeCard: UpgradeCardData | null;
};

export type MemoryDetailPayload = {
  detail: {
    id: string;
    title: string;
    suggestedTitle?: string;
    memoryState: string;
    memoryType: string;
    significance: string;
    startsAt: string;
    endsAt?: string;
    placeLabel: string;
    summary: string;
    notes: string;
    headerSummary: string;
  };
  summaryMetrics: SummaryMetric[];
  people: PersonCardData[];
  linkedThings: ThingCardData[];
  relatedReceipts: ReceiptCardData[];
  sequence: ActivityItem[];
};

export type FabMenuPayload = {
  title: string;
  groups: Array<{
    title: string;
    items: EntityAction[];
  }>;
};

export type AgentStructuredResult = {
  id: string;
  title: string;
  body: string;
  actionLabel: string;
  action: string;
  chips?: string[];
};

export type AgentChatPayload = {
  mode: string;
  title: string;
  conversation: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    citations?: Array<{ type: string; id?: string; label: string; action?: string }>;
    structuredResults?: AgentStructuredResult[];
    suggestedFollowUps?: string[];
    upgradeCard?: UpgradeCardData;
  }>;
  suggestedPrompts: string[];
  recentQueries: string[];
};

export type AgentVoicePayload = {
  mode: string;
  title: string;
  state: string;
  prompt?: string;
  transcript?: string;
  examples: string[];
  response?: {
    content: string;
    citations: Array<{ type: string; id?: string; label: string; action?: string }>;
    structuredResults: AgentStructuredResult[];
    suggestedFollowUps: string[];
  };
};

export type UpgradeCardData = {
  id?: string;
  tier: string;
  title: string;
  body: string;
  ctaLabel: string;
};

const receipts: ReceiptRecord[] = [
  {
    id: 'rcpt_vacuum',
    merchantName: 'Costco',
    purchasedAt: '2025-11-14T13:02:00-08:00',
    grandTotal: 349.99,
    currency: 'USD',
    lineItemCount: 1,
    status: 'trusted',
    note: 'Holiday appliance promotion.',
    lineHighlights: ['Dyson V8 Vacuum'],
    thingIds: ['thing_vacuum'],
    personIds: ['person_self'],
    memoryIds: [],
    category: 'Home',
  },
  {
    id: 'rcpt_mixer',
    merchantName: 'Williams Sonoma',
    purchasedAt: '2026-01-12T11:18:00-08:00',
    grandTotal: 429,
    currency: 'USD',
    lineItemCount: 2,
    status: 'trusted',
    note: 'Weekend kitchen upgrade.',
    lineHighlights: ['KitchenAid Artisan Mixer', 'Mixing bowl set'],
    thingIds: ['thing_mixer'],
    personIds: ['person_self', 'person_shanshan'],
    memoryIds: ['memory_brunch'],
    category: 'Kitchen',
  },
  {
    id: 'rcpt_airpods',
    merchantName: 'Apple Store',
    purchasedAt: '2026-01-28T17:45:00-08:00',
    grandTotal: 249,
    currency: 'USD',
    lineItemCount: 1,
    status: 'trusted',
    note: 'Replaced travel earbuds.',
    lineHighlights: ['AirPods Pro'],
    thingIds: ['thing_airpods'],
    personIds: ['person_self'],
    memoryIds: [],
    category: 'Tech',
    returnWindowEndsAt: '2026-02-11T17:45:00-08:00',
  },
  {
    id: 'rcpt_movie',
    merchantName: 'AMC Kabuki',
    purchasedAt: '2026-02-14T18:30:00-08:00',
    grandTotal: 42.1,
    currency: 'USD',
    lineItemCount: 2,
    status: 'trusted',
    note: 'Valentine movie night tickets.',
    lineHighlights: ['2 movie tickets'],
    thingIds: [],
    personIds: ['person_shanshan'],
    memoryIds: ['memory_movie'],
    category: 'Entertainment',
  },
  {
    id: 'rcpt_ramen',
    merchantName: 'Marufuku Ramen',
    purchasedAt: '2026-02-14T20:22:00-08:00',
    grandTotal: 58.74,
    currency: 'USD',
    lineItemCount: 3,
    status: 'trusted',
    note: 'Dinner after the movie.',
    lineHighlights: ['Ramen', 'Gyoza', 'Dessert'],
    thingIds: [],
    personIds: ['person_shanshan'],
    memoryIds: ['memory_movie'],
    category: 'Dining Out',
  },
  {
    id: 'rcpt_dinner',
    merchantName: 'Nopa',
    purchasedAt: '2026-02-21T20:14:00-08:00',
    grandTotal: 128.44,
    currency: 'USD',
    lineItemCount: 4,
    status: 'trusted',
    note: 'Dinner with Joe after a long week.',
    lineHighlights: ['Dinner', 'Drinks'],
    thingIds: [],
    personIds: ['person_joe'],
    memoryIds: ['memory_joe'],
    category: 'Dining Out',
  },
  {
    id: 'rcpt_ikea',
    merchantName: 'IKEA',
    purchasedAt: '2026-02-28T12:05:00-08:00',
    grandTotal: 189.32,
    currency: 'USD',
    lineItemCount: 3,
    status: 'needs_review',
    note: 'Entryway refresh items waiting for review.',
    lineHighlights: ['Storage bench', 'Wall hooks'],
    thingIds: ['thing_bench'],
    personIds: ['person_self'],
    memoryIds: ['memory_refresh'],
    category: 'Home',
    returnWindowEndsAt: '2026-03-30T12:05:00-08:00',
  },
  {
    id: 'rcpt_soccer',
    merchantName: 'Sports Basement',
    purchasedAt: '2026-03-03T14:25:00-08:00',
    grandTotal: 146.85,
    currency: 'USD',
    lineItemCount: 3,
    status: 'needs_review',
    note: 'Tournament gear for Coco.',
    lineHighlights: ['Adidas Predator cleats', 'Shin guards', 'Team socks'],
    thingIds: ['thing_cleats'],
    personIds: ['person_coco'],
    memoryIds: ['memory_soccer'],
    category: 'Kids',
    returnWindowEndsAt: '2026-04-02T14:25:00-08:00',
  },
];

const things: ThingRecord[] = [
  {
    id: 'thing_vacuum',
    displayName: 'Dyson V8 Vacuum',
    category: 'Home',
    subcategory: 'Appliance',
    status: 'active',
    purchasePrice: 349.99,
    currency: 'USD',
    acquiredAt: '2025-11-14T13:02:00-08:00',
    merchantName: 'Costco',
    receiptId: 'rcpt_vacuum',
    notes: 'Used mostly upstairs and still under manufacturer coverage.',
    warrantyEndsAt: '2027-11-14T13:02:00-08:00',
    badgeLabels: ['Warranty active', 'High value'],
    personIds: ['person_self'],
    memoryIds: [],
  },
  {
    id: 'thing_mixer',
    displayName: 'KitchenAid Artisan Mixer',
    category: 'Kitchen',
    subcategory: 'Appliance',
    status: 'active',
    purchasePrice: 379,
    currency: 'USD',
    acquiredAt: '2026-01-12T11:18:00-08:00',
    merchantName: 'Williams Sonoma',
    receiptId: 'rcpt_mixer',
    notes: 'Main anchor for the family brunch setup.',
    warrantyEndsAt: '2027-01-12T11:18:00-08:00',
    badgeLabels: ['Warranty active', 'Linked to memory'],
    personIds: ['person_self', 'person_shanshan'],
    memoryIds: ['memory_brunch'],
  },
  {
    id: 'thing_airpods',
    displayName: 'AirPods Pro',
    category: 'Tech',
    subcategory: 'Audio',
    status: 'active',
    purchasePrice: 249,
    currency: 'USD',
    acquiredAt: '2026-01-28T17:45:00-08:00',
    merchantName: 'Apple Store',
    receiptId: 'rcpt_airpods',
    notes: 'Travel companion with open return window.',
    warrantyEndsAt: '2027-01-28T17:45:00-08:00',
    returnWindowEndsAt: '2026-02-11T17:45:00-08:00',
    badgeLabels: ['Return window open', 'Warranty active'],
    personIds: ['person_self'],
    memoryIds: [],
  },
  {
    id: 'thing_bench',
    displayName: 'Entryway Storage Bench',
    category: 'Home',
    subcategory: 'Furniture',
    status: 'recent',
    purchasePrice: 149,
    currency: 'USD',
    acquiredAt: '2026-02-28T12:05:00-08:00',
    merchantName: 'IKEA',
    receiptId: 'rcpt_ikea',
    notes: 'Still waiting on final assembly and receipt review.',
    returnWindowEndsAt: '2026-03-30T12:05:00-08:00',
    badgeLabels: ['Recently added', 'Return window open'],
    personIds: ['person_self'],
    memoryIds: ['memory_refresh'],
  },
  {
    id: 'thing_cleats',
    displayName: 'Adidas Predator Cleats',
    category: 'Kids',
    subcategory: 'Sports',
    status: 'recent',
    purchasePrice: 86.5,
    currency: 'USD',
    acquiredAt: '2026-03-03T14:25:00-08:00',
    merchantName: 'Sports Basement',
    receiptId: 'rcpt_soccer',
    notes: 'Bought for Coco’s tournament weekend.',
    returnWindowEndsAt: '2026-04-02T14:25:00-08:00',
    badgeLabels: ['Recently added', 'Linked to memory'],
    personIds: ['person_coco'],
    memoryIds: ['memory_soccer'],
  },
];

const people: PersonRecord[] = [
  {
    id: 'person_self',
    displayName: 'You',
    relationshipType: 'self',
    tags: ['self', 'household'],
    notes: 'Primary organizer for household purchases and records.',
    linkedReceiptIds: ['rcpt_vacuum', 'rcpt_mixer', 'rcpt_airpods', 'rcpt_ikea'],
    linkedThingIds: ['thing_vacuum', 'thing_mixer', 'thing_airpods', 'thing_bench'],
    linkedMemoryIds: ['memory_brunch', 'memory_refresh'],
  },
  {
    id: 'person_shanshan',
    displayName: 'Shanshan',
    relationshipType: 'spouse',
    tags: ['family', 'household'],
    notes: 'Frequently linked to dinners, movie nights, and kitchen projects.',
    linkedReceiptIds: ['rcpt_mixer', 'rcpt_movie', 'rcpt_ramen'],
    linkedThingIds: ['thing_mixer'],
    linkedMemoryIds: ['memory_movie', 'memory_brunch'],
  },
  {
    id: 'person_coco',
    displayName: 'Coco',
    relationshipType: 'child',
    tags: ['family', 'gift recipient'],
    notes: 'Soccer gear, school purchases, and weekend events.',
    linkedReceiptIds: ['rcpt_soccer'],
    linkedThingIds: ['thing_cleats'],
    linkedMemoryIds: ['memory_soccer'],
  },
  {
    id: 'person_joe',
    displayName: 'Joe',
    relationshipType: 'friend',
    tags: ['friend'],
    notes: 'Often connected to dinners and movie nights.',
    linkedReceiptIds: ['rcpt_dinner'],
    linkedThingIds: [],
    linkedMemoryIds: ['memory_joe'],
  },
  {
    id: 'person_dad',
    displayName: 'Dad',
    relationshipType: 'parent',
    tags: ['family'],
    notes: 'Occasional gifts and home project advice.',
    linkedReceiptIds: [],
    linkedThingIds: [],
    linkedMemoryIds: [],
  },
];

const memories: MemoryRecord[] = [
  {
    id: 'memory_movie',
    title: 'Movie night in Japantown',
    memoryState: 'confirmed',
    memoryType: 'outing',
    significance: 'high',
    startsAt: '2026-02-14T18:30:00-08:00',
    endsAt: '2026-02-14T22:00:00-08:00',
    placeLabel: 'AMC Kabuki / Japantown',
    summary: 'A movie and ramen night that linked two receipts into one easy-to-keep story.',
    notes: 'Dinner after the movie made the memory feel complete.',
    receiptIds: ['rcpt_movie', 'rcpt_ramen'],
    personIds: ['person_shanshan'],
    thingIds: [],
  },
  {
    id: 'memory_joe',
    title: 'Dinner with Joe',
    memoryState: 'confirmed',
    memoryType: 'social',
    significance: 'medium',
    startsAt: '2026-02-21T20:00:00-08:00',
    placeLabel: 'Nopa',
    summary: 'A dinner receipt that is clearly attached to a person and event.',
    notes: 'Good example of spend becoming relationship context.',
    receiptIds: ['rcpt_dinner'],
    personIds: ['person_joe'],
    thingIds: [],
  },
  {
    id: 'memory_refresh',
    title: 'Entryway refresh Sunday',
    memoryState: 'candidate',
    memoryType: 'home project',
    significance: 'light',
    startsAt: '2026-02-28T12:05:00-08:00',
    placeLabel: 'IKEA',
    summary: 'An in-progress home project candidate built from a recent furniture purchase.',
    notes: 'Could become a confirmed home setup memory after assembly.',
    receiptIds: ['rcpt_ikea'],
    personIds: ['person_self'],
    thingIds: ['thing_bench'],
  },
  {
    id: 'memory_soccer',
    title: 'Soccer tournament weekend',
    memoryState: 'candidate',
    memoryType: 'family event',
    significance: 'high',
    startsAt: '2026-03-07T08:00:00-08:00',
    placeLabel: 'Crocker Amazon Fields',
    summary: 'Sports purchases, a child, and a weekend event clustering into a strong candidate.',
    notes: 'Likely to become a confirmed family memory once the rest of the weekend receipts arrive.',
    receiptIds: ['rcpt_soccer'],
    personIds: ['person_coco'],
    thingIds: ['thing_cleats'],
  },
  {
    id: 'memory_brunch',
    title: 'Family brunch prep',
    memoryState: 'confirmed',
    memoryType: 'family routine',
    significance: 'medium',
    startsAt: '2026-01-12T11:18:00-08:00',
    placeLabel: 'Home kitchen',
    summary: 'A kitchen purchase that quickly became part of a shared household ritual.',
    notes: 'This is the clearest “thing to memory” connection in the mock graph.',
    receiptIds: ['rcpt_mixer'],
    personIds: ['person_self', 'person_shanshan'],
    thingIds: ['thing_mixer'],
  },
];

const familyPersonas = new Set([
  'couple_pet',
  'parent_2_2',
  'single_parent',
  'grandparents',
  'adult_caring_for_parents',
]);

function trend(seed: number): number[] {
  return Array.from({ length: 7 }, (_, index) => Math.max(1, Math.round(seed * (0.55 + (((seed + index * 3) % 5) / 8)))));
}

function isFamilyPersona(personaId?: string) {
  return personaId ? familyPersonas.has(personaId) : true;
}

function projectedReceipts(): ReceiptRecord[] {
  const purchaseEvents = listProjectedPurchaseEvents();
  const purchaseLineItems = listProjectedPurchaseLineItems();
  const projectedMemoryIdsByReceipt = new Map<string, string[]>();

  listProjectedMemories().forEach((memory) => {
    memory.receiptIds.forEach((receiptId) => {
      const current = projectedMemoryIdsByReceipt.get(receiptId) ?? [];
      projectedMemoryIdsByReceipt.set(receiptId, [...current, memory.id]);
    });
  });

  return purchaseEvents.map((purchaseEvent) => {
    const eventLineItems = purchaseLineItems.filter((item) => item.purchaseEventId === purchaseEvent.id);
    const durableLineItems = eventLineItems.filter((item) => item.assetCandidateFlag);

    return {
      id: purchaseEvent.receiptId,
      merchantName: purchaseEvent.merchantName,
      purchasedAt: purchaseEvent.purchasedAt,
      grandTotal: purchaseEvent.grandTotal,
      currency: purchaseEvent.currency,
      lineItemCount: purchaseEvent.lineItemCount,
      status: 'trusted' as const,
      note: purchaseEvent.note,
      lineHighlights: eventLineItems.slice(0, 3).map((item) => item.description),
      thingIds: durableLineItems.flatMap((item) => (item.thingId ? [item.thingId] : [])),
      personIds: purchaseEvent.personIds,
      memoryIds: projectedMemoryIdsByReceipt.get(purchaseEvent.receiptId) ?? [],
      category: durableLineItems[0]?.category ?? purchaseEvent.productCategories[0] ?? 'General merchandise',
      returnWindowEndsAt: purchaseEvent.returnWindowEndsAt,
    };
  });
}

function projectedThingRecords(): ThingRecord[] {
  const projectedMemoryIdsByThing = new Map<string, string[]>();

  listProjectedMemories().forEach((memory) => {
    memory.thingIds.forEach((thingId) => {
      const current = projectedMemoryIdsByThing.get(thingId) ?? [];
      projectedMemoryIdsByThing.set(thingId, [...current, memory.id]);
    });
  });

  return listProjectedThings().map((thing) => ({
    id: thing.id,
    displayName: thing.displayName,
    category: thing.category,
    subcategory: thing.subcategory,
    status: thing.status,
    purchasePrice: thing.purchasePrice,
    currency: thing.currency,
    acquiredAt: thing.acquiredAt,
    merchantName: thing.merchantName,
    receiptId: thing.receiptId,
    notes: thing.notes,
    sourceDocumentId: thing.sourceDocumentId,
    warrantyEndsAt: thing.warrantyEndsAt,
    returnWindowEndsAt: thing.returnWindowEndsAt,
    badgeLabels: thing.badgeLabels,
    supportLabels: thing.supportLabels,
    linkedDocumentCount: thing.linkedDocumentCount,
    personIds: thing.personIds,
    memoryIds: projectedMemoryIdsByThing.get(thing.id) ?? thing.memoryIds,
  }));
}

function projectedMemories(): MemoryRecord[] {
  return listProjectedMemories().map((memory) => ({
    id: memory.id,
    title: memory.title,
    suggestedTitle: memory.suggestedTitle,
    memoryState: memory.memoryState,
    memoryType: memory.memoryType,
    significance: memory.significance,
    startsAt: memory.startsAt,
    endsAt: memory.endsAt,
    placeLabel: memory.placeLabel,
    summary: memory.summary,
    notes: memory.notes,
    receiptIds: memory.receiptIds,
    personIds: memory.personIds,
    thingIds: memory.thingIds,
  }));
}

function allReceipts() {
  return [...projectedReceipts(), ...receipts];
}

function allThings() {
  return [...projectedThingRecords(), ...things];
}

function allMemories() {
  return [...projectedMemories(), ...memories];
}

function allPeople() {
  const byId = new Map<string, PersonRecord>(people.map((person) => [person.id, person]));

  const linkedPersonIds = new Set<string>();
  allReceipts().forEach((receipt) => {
    receipt.personIds.forEach((personId) => linkedPersonIds.add(personId));
  });
  allThings().forEach((thing) => {
    thing.personIds.forEach((personId) => linkedPersonIds.add(personId));
  });
  allMemories().forEach((memory) => {
    memory.personIds.forEach((personId) => linkedPersonIds.add(personId));
  });

  linkedPersonIds.forEach((personId) => {
    if (byId.has(personId)) {
      return;
    }

    byId.set(personId, {
      id: personId,
      displayName: humanizePersonId(personId),
      relationshipType: 'linked person',
      tags: ['restored'],
      notes: 'Restored from trusted purchase graph context.',
      linkedReceiptIds: [],
      linkedThingIds: [],
      linkedMemoryIds: [],
    });
  });

  return Array.from(byId.values());
}

function getReceipt(id: string) {
  return allReceipts().find((receipt) => receipt.id === id);
}

function getThing(id: string) {
  return allThings().find((thing) => thing.id === id);
}

function getPerson(id: string) {
  return allPeople().find((person) => person.id === id);
}

function getMemory(id: string) {
  return allMemories().find((memory) => memory.id === id);
}

function receiptCard(receipt: ReceiptRecord): ReceiptCardData {
  const action = hasLiveReceipt(receipt.id)
    ? `route:/ingest/${receipt.id}`
    : receipt.thingIds[0]
      ? `route:/things/${receipt.thingIds[0]}`
      : receipt.memoryIds[0]
        ? `route:/memories/${receipt.memoryIds[0]}`
        : 'route:/home';

  return {
    id: receipt.id,
    merchantName: receipt.merchantName,
    purchasedAt: receipt.purchasedAt,
    grandTotal: receipt.grandTotal,
    currency: receipt.currency,
    lineItemCount: receipt.lineItemCount,
    status: receipt.status,
    note: receipt.note,
    tags: [receipt.category, ...receipt.lineHighlights.slice(0, 2)],
    action,
  };
}

function combinedRecentReceipts(limit: number) {
  return [...listLiveReceiptCards(), ...allReceipts().map(receiptCard)]
    .sort((left, right) => right.purchasedAt.localeCompare(left.purchasedAt))
    .slice(0, limit);
}

function thingCard(thing: ThingRecord): ThingCardData {
  return {
    id: thing.id,
    displayName: thing.displayName,
    category: thing.category,
    subcategory: thing.subcategory,
    merchantName: thing.merchantName,
    purchasePrice: thing.purchasePrice,
    currency: thing.currency,
    acquiredAt: thing.acquiredAt,
    badges: thing.badgeLabels,
    note: thing.notes,
    linkedPeople: thing.personIds.map((id) => getPerson(id)?.displayName ?? ''),
    linkedMemories: thing.memoryIds.map((id) => getMemory(id)?.title ?? ''),
    action: `route:/things/${thing.id}`,
  };
}

function personCard(person: PersonRecord): PersonCardData {
  const linkedReceiptIds = getLinkedReceiptIdsForPerson(person.id);
  const linkedThingIds = getLinkedThingIdsForPerson(person.id);
  const linkedMemoryIds = getLinkedMemoryIdsForPerson(person.id);
  const linkedReceipts = linkedReceiptIds.map((id) => getReceipt(id)).filter(Boolean) as ReceiptRecord[];
  const participantRecords = getProjectedPurchaseParticipantsForPerson(person.id);
  const participantSpend = participantRecords.reduce((sum, participant) => sum + participant.spendShare, 0);
  return {
    id: person.id,
    displayName: person.displayName,
    relationshipType: person.relationshipType,
    tags: person.tags,
    linkedPurchaseCount: Math.max(linkedReceipts.length, participantRecords.length),
    linkedThingCount: linkedThingIds.length,
    linkedMemoryCount: linkedMemoryIds.length,
    totalSpend: Number(
      (
        participantRecords.length
          ? participantSpend
          : linkedReceipts.reduce((sum, receipt) => sum + receipt.grandTotal, 0)
      ).toFixed(2),
    ),
    note: person.notes,
    action: `route:/people/${person.id}`,
  };
}

function memoryCard(memory: MemoryRecord): MemoryCardData {
  return {
    id: memory.id,
    title: memory.title,
    memoryState: memory.memoryState,
    memoryType: memory.memoryType,
    significance: memory.significance,
    startsAt: memory.startsAt,
    placeLabel: memory.placeLabel,
    summary: memory.summary,
    peoplePreview: memory.personIds.map((id) => getPerson(id)?.displayName ?? ''),
    linkedThingCount: memory.thingIds.length,
    linkedReceiptCount: memory.receiptIds.length,
    action: `route:/memories/${memory.id}`,
  };
}

function recentActivity(): ActivityItem[] {
  return [
    {
      id: 'activity_soccer',
      title: 'Soccer gear needs review',
      body: 'The Sports Basement receipt already links to Coco and a memory candidate.',
      occurredAt: '2026-03-03T14:25:00-08:00',
      kind: 'receipt',
      action: 'route:/things/thing_cleats',
    },
    {
      id: 'activity_refresh',
      title: 'Entryway refresh became a candidate memory',
      body: 'The IKEA storage bench is now connected to a home project story.',
      occurredAt: '2026-02-28T12:05:00-08:00',
      kind: 'memory',
      action: 'route:/memories/memory_refresh',
    },
    {
      id: 'activity_joe',
      title: 'Joe is connected to a recent dinner',
      body: 'People and memories both picked up the same Nopa purchase.',
      occurredAt: '2026-02-21T20:14:00-08:00',
      kind: 'person',
      action: 'route:/people/person_joe',
    },
  ];
}

function upgradeCard(tier: string, title: string, body: string): UpgradeCardData {
  return {
    tier,
    title,
    body,
    ctaLabel: tier === 'family_pro' ? 'See Family Pro' : 'Upgrade to Personal Pro',
  };
}

function coreSummaryMetrics(personaId?: string): SummaryMetric[] {
  const personCount = isFamilyPersona(personaId) ? 5 : 4;
  const receiptCount = allReceipts().length + listLiveReceiptCards().length;
  const thingCount = allThings().length;
  return [
    {
      label: 'Receipts',
      value: String(receiptCount),
      note: 'Captured into the relationship graph',
      tone: 'blue',
      trend: trend(receiptCount),
    },
    {
      label: 'Things',
      value: String(thingCount),
      note: 'Durable and meaningful purchases',
      tone: 'green',
      trend: trend(thingCount),
    },
    {
      label: 'People',
      value: String(personCount),
      note: 'Connected to purchases or moments',
      tone: 'amber',
      trend: trend(personCount),
    },
  ];
}

function getLinkedReceiptIdsForPerson(personId: string) {
  const ids = new Set<string>((getPerson(personId)?.linkedReceiptIds ?? []).filter(Boolean));

  allReceipts().forEach((receipt) => {
    if (receipt.personIds.includes(personId)) {
      ids.add(receipt.id);
    }
  });

  return Array.from(ids);
}

function humanizePersonId(personId: string) {
  return personId
    .replace(/^person[_-]?/i, '')
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'Linked Person';
}

function getLinkedThingIdsForPerson(personId: string) {
  const ids = new Set<string>((getPerson(personId)?.linkedThingIds ?? []).filter(Boolean));

  allThings().forEach((thing) => {
    if (thing.personIds.includes(personId)) {
      ids.add(thing.id);
    }
  });

  return Array.from(ids);
}

function getLinkedMemoryIdsForPerson(personId: string) {
  const ids = new Set<string>((getPerson(personId)?.linkedMemoryIds ?? []).filter(Boolean));

  allMemories().forEach((memory) => {
    if (memory.personIds.includes(personId)) {
      ids.add(memory.id);
    }
  });

  return Array.from(ids);
}

function getProjectedPurchaseParticipantsForPerson(personId: string) {
  return listProjectedPurchaseParticipants().filter((participant) => participant.personId === personId);
}

function recentMemoryCards(limit: number) {
  return allMemories()
    .slice()
    .sort((left, right) => right.startsAt.localeCompare(left.startsAt))
    .slice(0, limit)
    .map(memoryCard);
}

function recentThingCards(limit: number) {
  return allThings()
    .slice()
    .sort((left, right) => right.acquiredAt.localeCompare(left.acquiredAt))
    .slice(0, limit)
    .map(thingCard);
}

function firstNeedsReviewReceiptCard() {
  const liveReceipt = listLiveReceiptCards()
    .filter((receipt) => receipt.status === 'needs_review')
    .sort((left, right) => right.purchasedAt.localeCompare(left.purchasedAt))[0];

  if (liveReceipt) {
    return {
      title: `Finish reviewing the ${liveReceipt.merchantName} receipt`,
      body: liveReceipt.note,
      actionLabel: 'Continue review',
      action: liveReceipt.action,
    };
  }

  const staticReceipt = receipts
    .filter((receipt) => receipt.status === 'needs_review')
    .sort((left, right) => right.purchasedAt.localeCompare(left.purchasedAt))[0];

  if (!staticReceipt) {
    return null;
  }

  return {
    title: `Follow up on ${staticReceipt.merchantName}`,
    body: staticReceipt.note,
    actionLabel: 'Open Thing',
    action: staticReceipt.thingIds[0] ? `route:/things/${staticReceipt.thingIds[0]}` : 'route:/home',
  };
}

function thingCategoryBreakdown() {
  const totals = new Map<string, { label: string; count: number; spend: number }>();

  allThings().forEach((thing) => {
    const normalizedKey = thing.category.toLowerCase();
    const label = thing.category
      .split(/[\s_-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
    const current = totals.get(normalizedKey) ?? { label, count: 0, spend: 0 };
    totals.set(normalizedKey, {
      label: current.label,
      count: current.count + 1,
      spend: current.spend + thing.purchasePrice,
    });
  });

  return Array.from(totals.entries())
    .map(([key, value]) => ({
      id: `cat_${key.replace(/[^a-z0-9]+/g, '_')}`,
      label: value.label,
      thingCount: value.count,
      spend: Number(value.spend.toFixed(2)),
    }))
    .sort((left, right) => right.spend - left.spend);
}

function buildHomePayload(options: RouteBuilderOptions): HomePayload {
  const state = options.state ?? 'populated';
  const continueCard = firstNeedsReviewReceiptCard();

  if (state === 'empty') {
    return {
      header: {
        title: 'Home',
        searchPlaceholder: 'Search purchases, Things, people, memories',
      },
      hero: {
        headline: 'Turn purchases into life context',
        body: 'Start with one receipt and the app can grow outward into Things, People, and Memories.',
        primaryCta: { label: 'Open Add Actions', action: 'open:fabsheet' },
        secondaryCta: { label: 'Ask Agent', action: 'agent:chat' },
      },
      summaryMetrics: [],
      continueCard: null,
      reminders: [],
      recentActivity: [],
      recentReceipts: [],
      topThings: [],
      topPeople: [],
      recentMemories: [],
      upgradeCard: null,
    };
  }

  if (state === 'first_use') {
    return {
      header: {
        title: 'Home',
        searchPlaceholder: 'Search purchases, Things, people, memories',
      },
      hero: {
        headline: 'You already have a story forming',
        body: 'A few receipts are enough to begin connecting purchases to people and moments.',
        primaryCta: { label: 'Add Receipt', action: 'compose:add_receipt' },
        secondaryCta: { label: 'Add Memory', action: 'compose:add_memory' },
      },
      summaryMetrics: coreSummaryMetrics(options.personaId).slice(0, 2),
      continueCard,
      reminders: [
        {
          id: 'first_use_reminder',
          title: 'Add one more person',
          body: 'Linking a person helps the app turn purchases into emotional context.',
          tone: 'amber',
          actionLabel: 'Add person',
          action: 'compose:add_person',
        },
      ],
      recentActivity: recentActivity().slice(0, 2),
      recentReceipts: combinedRecentReceipts(2),
      topThings: recentThingCards(2),
      topPeople: [personCard(getPerson('person_coco') ?? people[0])],
      recentMemories: recentMemoryCards(1),
      upgradeCard: null,
    };
  }

  const isPremiumState = state.includes('conversion') || state.includes('premium');
  return {
    header: {
      title: 'Home',
      searchPlaceholder: 'Search purchases, Things, people, memories',
    },
    hero: {
      headline: 'Your life inventory is taking shape',
      body: 'Receipts are now flowing into Things, People, and Memories with a clear relationship graph.',
      primaryCta: { label: 'Open Add Actions', action: 'open:fabsheet' },
      secondaryCta: { label: 'Ask Agent', action: 'agent:chat' },
    },
    summaryMetrics: [
      ...coreSummaryMetrics(options.personaId),
      {
        label: 'Memories',
        value: String(allMemories().length),
        note: 'Moments with purchase evidence',
        tone: 'blue',
        trend: trend(allMemories().length),
      },
    ],
    continueCard,
    reminders: [
      {
        id: 'reminder_return',
        title: 'Two return windows are still open',
        body: 'AirPods Pro and the Entryway Storage Bench can still be returned if needed.',
        tone: 'amber',
        actionLabel: 'Open Things',
        action: 'route:/things',
      },
      {
        id: 'reminder_memory',
        title: 'Confirm the soccer weekend memory',
        body: 'The receipt, person, and thing links are already in place.',
        tone: 'green',
        actionLabel: 'Open Memories',
        action: 'route:/memories/memory_soccer',
      },
    ],
    recentActivity: recentActivity(),
    recentReceipts: combinedRecentReceipts(4),
    topThings: recentThingCards(3),
    topPeople: ['person_coco', 'person_shanshan', 'person_joe'].map((id) => personCard(getPerson(id) ?? people[0])),
    recentMemories: recentMemoryCards(3),
    upgradeCard: isPremiumState
      ? upgradeCard('personal_pro', 'Unlock warranty and richer ownership support', 'Keep manuals, warranty coverage, and stronger agent help tied to the Things you own.')
      : null,
  };
}

function buildThingsPayload(options: RouteBuilderOptions): ThingsPayload {
  const state = options.state ?? 'overview_populated';
  if (state === 'empty') {
    return {
      header: {
        title: 'Things',
        viewOptions: ['Overview', 'By Category', 'Recently Added', 'Needs Review'],
        selectedView: 'Overview',
        searchPlaceholder: 'Search Things',
        filterLabel: 'All categories',
        sortLabel: 'Most recent',
      },
      actionStrip: ['Returns', 'Warranty', 'Linked'],
      summaryMetrics: [],
      visualization: null,
      categories: [],
      things: [],
      highlightedThingIds: [],
      upgradeCard: null,
    };
  }

  const allThingRecords = state === 'owned_things' ? allThings().filter((thing) => thing.status !== 'consumed') : allThings();
  const categoryBreakdown = thingCategoryBreakdown();
  const premium = state.includes('premium');
  return {
    header: {
      title: 'Things',
      viewOptions: ['Overview', 'By Category', 'Recently Added', 'Needs Review'],
      selectedView: state === 'owned_things' ? 'Recently Added' : 'Overview',
      searchPlaceholder: 'Search Things or categories',
      filterLabel: 'All categories',
      sortLabel: 'Most connected',
    },
    actionStrip: ['Returns', 'Warranty', 'Linked'],
    summaryMetrics: [
      {
        label: 'Tracked',
        value: String(allThingRecords.length),
        note: 'Items that matter beyond the receipt',
        tone: 'blue',
        trend: trend(allThingRecords.length),
      },
      {
        label: 'Warranty',
        value: String(allThingRecords.filter((thing) => Boolean(thing.warrantyEndsAt)).length),
        note: 'Coverage currently visible',
        tone: 'green',
        trend: trend(3),
      },
      {
        label: 'Needs review',
        value: String(receipts.filter((receipt) => receipt.status === 'needs_review').length + listLiveReceiptCards().filter((receipt) => receipt.status === 'needs_review').length),
        note: 'Receipts still shaping item details',
        tone: 'amber',
        trend: trend(2),
      },
    ],
    visualization: {
      type: 'treemap',
      series: categoryBreakdown.map((category) => ({
        id: category.id,
        label: category.label,
        value: category.spend,
      })),
    },
    categories: categoryBreakdown,
    things: allThingRecords.map(thingCard),
    highlightedThingIds: allThingRecords
      .filter((thing) => thing.status === 'recent')
      .slice(0, 2)
      .map((thing) => thing.id),
    upgradeCard: premium
      ? upgradeCard('personal_pro', 'Go deeper on warranties and manuals', 'Personal Pro keeps the supporting docs and warranty coverage attached to each important Thing.')
      : null,
  };
}

function buildThingDetailPayload(options: RouteBuilderOptions): ThingDetailPayload {
  const allThingRecords = allThings();
  const thing = getThing(options.params?.thingId ?? 'thing_mixer') ?? allThingRecords[0];
  const sourceReceipt = getReceipt(thing.receiptId) ?? null;
  const merchant = listProjectedMerchants().find((candidate) => candidate.merchantId === `merchant_${thing.merchantName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`)
    ?? listProjectedMerchants().find((candidate) => candidate.displayName === thing.merchantName)
    ?? null;
  const object = listProjectedObjects().find((candidate) => candidate.linkedThingIds.includes(thing.id))
    ?? listProjectedObjects().find((candidate) => candidate.displayName === thing.displayName)
    ?? null;
  const thingTags = listProjectedTags().filter((candidate) => candidate.linkedThingIds.includes(thing.id));
  const semanticRecord = listProjectedSemanticRecords().find((candidate) => candidate.receiptId === thing.receiptId) ?? null;
  const sourceDocumentRecord = listProjectedSourceDocuments().find((candidate) => candidate.receiptId === thing.receiptId) ?? null;
  const extractionRunRecord = listProjectedExtractionRuns().find((candidate) => candidate.receiptId === thing.receiptId) ?? null;
  const product = listProjectedProducts().find((candidate) => candidate.linkedThingId === thing.id)
    ?? listProjectedProducts().find((candidate) => candidate.receiptId === thing.receiptId && candidate.displayName === thing.displayName)
    ?? null;
  const warranty = listProjectedWarranties().find((candidate) => candidate.thingId === thing.id) ?? null;
  const returnSupport = listProjectedReturnSupports().find((candidate) => candidate.thingId === thing.id) ?? null;
  const policies = listProjectedPolicies().filter((candidate) => candidate.thingId === thing.id);
  const locations = listProjectedLocations().filter((candidate) => candidate.linkedThingIds.includes(thing.id));
  const evidenceLinks = listProjectedEvidenceRecords().filter((candidate) => candidate.linkedThingIds.includes(thing.id));
  const documents = listProjectedThingDocuments().filter((candidate) => candidate.thingId === thing.id);
  const documentLinks = listProjectedDocumentLinks().filter((candidate) =>
    candidate.targetObjectId === thing.id || candidate.receiptId === thing.receiptId,
  );
  const linkedPeople = thing.personIds.map((id) => personCard(getPerson(id) ?? people[0]));
  const linkedMemories = thing.memoryIds.map((id) => memoryCard(getMemory(id) ?? allMemories()[0]));
  const relatedThings = allThingRecords
    .filter((candidate) => candidate.category === thing.category && candidate.id !== thing.id)
    .slice(0, 2)
    .map(thingCard);
  return {
    detail: {
      id: thing.id,
      title: thing.displayName,
      category: thing.category,
      purchasePrice: thing.purchasePrice,
      currency: thing.currency,
      acquiredAt: thing.acquiredAt,
      merchantName: thing.merchantName,
      notes: thing.notes,
      badges: thing.badgeLabels,
      supportLabels: thing.supportLabels ?? [],
      headerSummary: `Bought at ${thing.merchantName}, linked to ${thing.linkedDocumentCount ?? 0} receipt document${thing.linkedDocumentCount === 1 ? '' : 's'}, and connected to ${thing.personIds.length || 0} people and ${thing.memoryIds.length || 0} memories.`,
    },
    product: product
      ? {
          title: product.displayName,
          matchStatus: product.matchStatus,
          confidenceLabel: `${Math.round(product.matchConfidence * 100)}% confidence`,
          category: `${product.category} / ${product.subcategory}`,
          note: product.note,
        }
      : null,
    warranty: warranty
      ? {
          providerName: warranty.providerName,
          coverageType: warranty.coverageType,
          endsAt: warranty.endsAt,
          status: warranty.status,
          note: warranty.note,
        }
      : null,
    returnSupport: returnSupport
      ? {
          policyLabel: returnSupport.policyLabel,
          windowEndsAt: returnSupport.windowEndsAt,
          status: returnSupport.status,
          note: returnSupport.note,
        }
      : null,
    policies: policies.map((policy) => ({
      id: policy.id,
      policyKind: policy.policyKind.replace(/_/g, ' '),
      title: policy.title,
      providerName: policy.providerName,
      status: policy.status,
      effectiveLabel: `${policy.effectiveAt} to ${policy.endsAt}`,
      linkedSupportLabel: policy.linkedSupportRecordId.replace(/_/g, ' '),
      note: policy.note,
    })),
    locations: locations.map((location) => ({
      id: location.id,
      label: location.label,
      locationKind: location.locationKind.replace(/_/g, ' '),
      relationshipLabel: `${location.linkedMemoryIds.length} ${location.linkedMemoryIds.length === 1 ? 'memory' : 'memories'} · ${location.linkedPersonIds.length} people`,
      note: location.note,
    })),
    evidenceLinks: evidenceLinks.map((evidence) => ({
      id: evidence.id,
      label: evidence.label,
      evidenceType: evidence.evidenceType,
      snippet: evidence.snippet,
      note: evidence.note,
    })),
    documents: documents.map((document) => ({
      id: document.id,
      title: document.title,
      documentRole: document.documentRole,
      documentType: document.documentType,
    })),
    documentLinks: documentLinks.map((link) => ({
      id: link.id,
      targetObjectType: link.targetObjectType,
      targetLabel: link.targetLabel,
      documentRole: link.documentRole,
      note: link.note,
    })),
    tagGraph: thingTags.map((tag) => ({
      id: tag.id,
      framework: tag.framework.replace(/_/g, ' '),
      label: tag.label,
      linkageCount: `${tag.linkedProductIds.length} product${tag.linkedProductIds.length === 1 ? '' : 's'} · ${tag.linkedThingIds.length} Thing${tag.linkedThingIds.length === 1 ? '' : 's'}`,
      spendLabel: `$${tag.trustedSpendTotal.toFixed(2)} tagged spend`,
      note: tag.note,
    })),
    retrievalProfile: semanticRecord
      ? {
          scope: semanticRecord.retrievalScope.replace(/_/g, ' '),
          embeddingVersion: semanticRecord.embeddingVersion,
          keywordCount: `${semanticRecord.keywords.length} keywords`,
          termCount: `${semanticRecord.embeddingTerms.length} embedding terms`,
          preview: semanticRecord.textPreview,
        }
      : null,
    provenance: sourceDocumentRecord && extractionRunRecord
      ? {
          sourceLabel: sourceDocumentRecord.sourceType.replace(/_/g, ' '),
          captureLabel: sourceDocumentRecord.captureChannel.replace(/_/g, ' '),
          fileCountLabel: `${sourceDocumentRecord.fileCount} file${sourceDocumentRecord.fileCount === 1 ? '' : 's'}`,
          providerLabel: extractionRunRecord.providerLabel,
          parserLabel: extractionRunRecord.parserVersion,
          statusLabel: extractionRunRecord.status,
          note: extractionRunRecord.note,
        }
      : null,
    merchant: merchant
      ? {
          title: merchant.displayName,
          retailerProfile: merchant.retailerProfile,
          kind: merchant.kind,
          purchaseCount: `${merchant.purchaseCount} trusted purchase${merchant.purchaseCount === 1 ? '' : 's'}`,
          spendLabel: `$${merchant.trustedSpendTotal.toFixed(2)} trusted spend`,
          defaultCategories: merchant.defaultProductCategories,
          note: merchant.merchantDirectoryId
            ? 'This merchant is linked to the shared vendor library and can reuse return and category defaults.'
            : 'This merchant is currently only known from your reviewed receipts.',
        }
      : null,
    object: object
      ? {
          title: object.displayName,
          category: `${object.category} / ${object.subcategory}`,
          householdTags: object.householdTags,
          lemTags: object.lemTags,
          purchaseCount: `${object.purchaseCount} trusted purchase${object.purchaseCount === 1 ? '' : 's'}`,
          spendLabel: `$${object.trustedSpendTotal.toFixed(2)} trusted spend`,
          note: object.objectDirectoryId
            ? 'This object is linked to the shared object library for tagging and downstream matching.'
            : 'This object currently exists only from your trusted purchase graph.',
        }
      : null,
    metadata: [
      { label: 'Category', value: `${thing.category} / ${thing.subcategory}` },
      { label: 'Purchase source', value: thing.merchantName },
      { label: 'Purchase date', value: thing.acquiredAt },
      { label: 'Receipt document', value: thing.sourceDocumentId ?? 'No linked source document' },
      { label: 'Linked documents', value: String(thing.linkedDocumentCount ?? 0) },
      { label: 'Warranty', value: warranty?.endsAt ?? thing.warrantyEndsAt ?? 'No warranty tracked' },
      { label: 'Return window', value: thing.returnWindowEndsAt ?? 'Closed' },
    ],
    purchaseSource: sourceReceipt ? receiptCard(sourceReceipt) : null,
    linkedPeople,
    linkedMemories,
    relatedThings,
    activity: [
      {
        id: `${thing.id}-activity-purchased`,
        title: 'Purchased',
        body: `Receipt captured at ${thing.merchantName} for ${thing.displayName}.`,
        occurredAt: thing.acquiredAt,
        kind: 'receipt',
        action: `route:/things/${thing.id}`,
      },
      ...linkedMemories.map((memory) => ({
        id: `${thing.id}-${memory.id}`,
        title: 'Linked to memory',
        body: memory.summary,
        occurredAt: memory.startsAt,
        kind: 'memory' as const,
        action: memory.action,
      })),
    ],
    upgradeCard: options.state?.includes('premium') || thing.id === 'thing_airpods'
      ? upgradeCard('personal_pro', 'Keep manuals and coverage attached', 'Use Personal Pro to store supporting docs and richer ownership history.')
      : null,
  };
}

function buildPeoplePayload(options: RouteBuilderOptions): PeoplePayload {
  const state = options.state ?? 'network_populated';
  if (state === 'empty') {
    return {
      header: {
        title: 'People',
        viewOptions: ['Relationship map', 'All people', 'Household'],
        selectedView: 'Relationship map',
        searchPlaceholder: 'Search people or roles',
        filterLabel: 'All relationships',
      },
      actionStrip: ['Household', 'Gifts', 'Linked'],
      summaryMetrics: [],
      network: null,
      spotlight: null,
      people: [],
      upgradeCard: null,
    };
  }

  const spotlightPerson = getPerson('person_coco') ?? people[0];
  return {
    header: {
      title: 'People',
      viewOptions: ['Relationship map', 'All people', 'Household'],
      selectedView: 'Relationship map',
      searchPlaceholder: 'Search people or roles',
      filterLabel: 'All relationships',
    },
    actionStrip: ['Household', 'Gifts', 'Linked'],
    summaryMetrics: [
      {
        label: 'People',
        value: String(allPeople().length),
        note: 'Who matters in your purchase graph',
        tone: 'blue',
        trend: trend(allPeople().length),
      },
      {
        label: 'Linked Things',
        value: String(allThings().filter((thing) => thing.personIds.length > 0).length),
        note: 'Items tied to real people',
        tone: 'green',
        trend: trend(4),
      },
      {
        label: 'Linked Memories',
        value: String(allMemories().filter((memory) => memory.personIds.length > 0).length),
        note: 'Moments tied to relationships',
        tone: 'amber',
        trend: trend(3),
      },
    ],
    network: {
      rings: [
        {
          label: 'Family',
          count: 3,
          nodes: ['person_self', 'person_shanshan', 'person_coco'].map((id) => {
            const person = getPerson(id) ?? people[0];
            return { id: person.id, label: person.displayName, relationshipType: person.relationshipType };
          }),
        },
        {
          label: 'Friends',
          count: 1,
          nodes: ['person_joe'].map((id) => {
            const person = getPerson(id) ?? people[0];
            return { id: person.id, label: person.displayName, relationshipType: person.relationshipType };
          }),
        },
      ],
    },
    spotlight: {
      title: `${spotlightPerson.displayName} has the strongest recent signal`,
      body: 'Recent gear purchases, a memory candidate, and household context all connect through one child profile.',
      actionLabel: 'Open Coco',
      action: 'route:/people/person_coco',
    },
    people: allPeople().map(personCard),
    upgradeCard: state.includes('family')
      ? upgradeCard('family_pro', 'Share People context with household members', 'Family Pro is the upgrade path for collaborative household relationship context.')
      : null,
  };
}

function buildPersonDetailPayload(options: RouteBuilderOptions): PersonDetailPayload {
  const person = getPerson(options.params?.personId ?? 'person_coco') ?? allPeople()[0];
  const linkedThingIds = getLinkedThingIdsForPerson(person.id);
  const linkedReceiptIds = getLinkedReceiptIdsForPerson(person.id);
  const linkedMemoryIds = getLinkedMemoryIdsForPerson(person.id);
  const participantRecords = getProjectedPurchaseParticipantsForPerson(person.id);
  const linkedThingCards = linkedThingIds.map((id) => thingCard(getThing(id) ?? allThings()[0]));
  const linkedMemoryCards = linkedMemoryIds.map((id) => memoryCard(getMemory(id) ?? allMemories()[0]));
  const linkedReceiptCards = linkedReceiptIds.map((id) => receiptCard(getReceipt(id) ?? allReceipts()[0]));
  const totalSpend = participantRecords.length
    ? participantRecords.reduce((sum, participant) => sum + participant.spendShare, 0)
    : linkedReceiptIds.map((id) => getReceipt(id)?.grandTotal ?? 0).reduce((sum, value) => sum + value, 0);
  const participationRoles = Array.from(new Set(participantRecords.map((participant) => participant.participationRole.replace(/_/g, ' '))));
  const linkedLineItemCount = participantRecords.reduce((sum, participant) => sum + participant.linkedLineItemCount, 0);
  const linkedThingCount = participantRecords.reduce((sum, participant) => sum + participant.linkedThingCount, 0);
  const linkedMemoryCount = participantRecords.reduce((sum, participant) => sum + participant.linkedMemoryCount, 0);
  return {
    detail: {
      id: person.id,
      title: person.displayName,
      relationshipType: person.relationshipType,
      notes: person.notes,
      tags: person.tags,
      headerSummary: participantRecords.length
        ? `${participantRecords.length} purchase events, ${linkedThingIds.length} things, and ${linkedMemoryIds.length} memories now connect through structured participation records.`
        : `${linkedThingIds.length} things, ${linkedMemoryIds.length} memories, and ${linkedReceiptIds.length} linked purchases.`,
    },
    summaryMetrics: [
      {
        label: 'Purchases',
        value: String(participantRecords.length || linkedReceiptIds.length),
        note: participantRecords.length ? 'Structured purchase events involving this person' : 'Receipts involving this person',
        tone: 'blue',
        trend: trend(participantRecords.length || linkedReceiptIds.length || 1),
      },
      {
        label: 'Things',
        value: String(linkedThingIds.length),
        note: 'Items connected to this person',
        tone: 'green',
        trend: trend(linkedThingIds.length || 1),
      },
      {
        label: 'Spend',
        value: `$${totalSpend.toFixed(0)}`,
        note: participantRecords.length ? 'Structured spend share across trusted purchases' : 'Mocked linked spend total',
        tone: 'amber',
        trend: trend(Math.max(1, Math.round(totalSpend / 40))),
      },
    ],
    purchaseParticipation: participantRecords.length
      ? {
          roles: participationRoles,
          linkedLineItemCount,
          linkedThingCount,
          linkedMemoryCount,
          spendLabel: `$${totalSpend.toFixed(2)} structured spend share`,
          note: participantRecords[0]?.note ?? 'This person is linked to trusted purchase participation records.',
        }
      : null,
    associatedThings: linkedThingCards,
    associatedMemories: linkedMemoryCards,
    relatedReceipts: linkedReceiptCards,
    activity: [
      ...linkedReceiptCards.map((receipt) => ({
        id: `${person.id}-${receipt.id}`,
        title: receipt.merchantName,
        body: receipt.note,
        occurredAt: receipt.purchasedAt,
        kind: 'receipt' as const,
        action: linkedThingCards[0]?.action ?? `route:/people/${person.id}`,
      })),
      ...linkedMemoryCards.map((memory) => ({
        id: `${person.id}-${memory.id}`,
        title: memory.title,
        body: memory.summary,
        occurredAt: memory.startsAt,
        kind: 'memory' as const,
        action: memory.action,
      })),
    ],
  };
}

function buildMemoriesPayload(options: RouteBuilderOptions): MemoriesPayload {
  const state = options.state ?? 'timeline_populated';
  if (state === 'empty') {
    return {
      header: {
        title: 'Memories',
        viewOptions: ['Timeline', 'By type', 'Candidates'],
        selectedView: 'Timeline',
        searchPlaceholder: 'Search memories',
        filterLabel: 'All memories',
      },
      actionStrip: ['Timeline', 'People', 'Linked'],
      summaryMetrics: [],
      featuredMemory: null,
      timeline: [],
      upgradeCard: null,
    };
  }

  return {
    header: {
      title: 'Memories',
      viewOptions: ['Timeline', 'By type', 'Candidates'],
      selectedView: 'Timeline',
      searchPlaceholder: 'Search memories',
      filterLabel: 'All memories',
    },
    actionStrip: ['Timeline', 'People', 'Linked'],
    summaryMetrics: [
      {
        label: 'Confirmed',
        value: String(allMemories().filter((memory) => memory.memoryState === 'confirmed').length),
        note: 'Memories the user would keep',
        tone: 'green',
        trend: trend(3),
      },
      {
        label: 'Candidates',
        value: String(allMemories().filter((memory) => memory.memoryState === 'candidate').length),
        note: 'System-assisted moments waiting for review',
        tone: 'amber',
        trend: trend(2),
      },
      {
        label: 'Linked receipts',
        value: String(allMemories().reduce((sum, memory) => sum + memory.receiptIds.length, 0)),
        note: 'Purchase events behind the stories',
        tone: 'blue',
        trend: trend(5),
      },
    ],
    featuredMemory: memoryCard(getMemory('memory_movie') ?? allMemories()[0]),
    timeline: allMemories()
      .slice()
      .sort((left, right) => right.startsAt.localeCompare(left.startsAt))
      .map(memoryCard),
    upgradeCard: state.includes('premium')
      ? upgradeCard('personal_pro', 'Keep richer notes and attachments with memories', 'Upgrade for stronger memory support tied back to your purchases and Things.')
      : null,
  };
}

function buildMemoryDetailPayload(options: RouteBuilderOptions): MemoryDetailPayload {
  const memory = getMemory(options.params?.memoryId ?? 'memory_movie') ?? allMemories()[0];
  return {
    detail: {
      id: memory.id,
      title: memory.title,
      suggestedTitle: memory.suggestedTitle,
      memoryState: memory.memoryState,
      memoryType: memory.memoryType,
      significance: memory.significance,
      startsAt: memory.startsAt,
      endsAt: memory.endsAt,
      placeLabel: memory.placeLabel,
      summary: memory.summary,
      notes: memory.notes,
      headerSummary: `${memory.receiptIds.length} receipts, ${memory.personIds.length} people, and ${memory.thingIds.length} things connected to this memory.`,
    },
    summaryMetrics: [
      {
        label: 'People',
        value: String(memory.personIds.length),
        note: 'People in this moment',
        tone: 'blue',
        trend: trend(memory.personIds.length || 1),
      },
      {
        label: 'Things',
        value: String(memory.thingIds.length),
        note: 'Objects anchored to the story',
        tone: 'green',
        trend: trend(memory.thingIds.length || 1),
      },
      {
        label: 'Receipts',
        value: String(memory.receiptIds.length),
        note: 'Purchase evidence behind the memory',
        tone: 'amber',
        trend: trend(memory.receiptIds.length || 1),
      },
    ],
    people: memory.personIds.map((id) => personCard(getPerson(id) ?? people[0])),
    linkedThings: memory.thingIds.map((id) => thingCard(getThing(id) ?? things[0])),
    relatedReceipts: memory.receiptIds.map((id) => receiptCard(getReceipt(id) ?? receipts[0])),
    sequence: [
      ...memory.receiptIds.map((id) => {
        const receipt = getReceipt(id) ?? receipts[0];
        return {
          id: `${memory.id}-${receipt.id}`,
          title: receipt.merchantName,
          body: receipt.note,
          occurredAt: receipt.purchasedAt,
          kind: 'receipt' as const,
          action: `route:/memories/${memory.id}`,
        };
      }),
      {
        id: `${memory.id}-story`,
        title: 'Story captured',
        body: memory.notes,
        occurredAt: memory.startsAt,
        kind: 'memory',
        action: `route:/memories/${memory.id}`,
      },
    ],
  };
}

function buildFabMenuPayload(): FabMenuPayload {
  return {
    title: 'Add Actions',
    groups: [
      {
        title: 'Create',
        items: [
          { label: 'Add Receipt', action: 'compose:add_receipt', icon: 'receipt' },
          { label: 'Add Thing', action: 'compose:add_thing', icon: 'things' },
          { label: 'Add Person', action: 'compose:add_person', icon: 'people' },
          { label: 'Add Memory', action: 'compose:add_memory', icon: 'sparkle' },
          { label: 'Quick Capture / Note', action: 'compose:quick_note', icon: 'upload' },
        ],
      },
      {
        title: 'Ask Agent',
        items: [
          { label: 'Ask Agent — Chat', action: 'agent:chat', icon: 'chat', suggestedPrompt: 'Show me things bought for Coco' },
          { label: 'Ask Agent — Voice', action: 'agent:voice', icon: 'mic', suggestedPrompt: 'What still has warranty coverage?' },
        ],
      },
    ],
  };
}

function buildAgentChatPayload(options: RouteBuilderOptions): AgentChatPayload {
  const state = options.state ?? 'linked_results';
  const thingCitations = ['thing_cleats', 'thing_mixer'].map((id) => {
    const thing = getThing(id) ?? things[0];
    return { type: 'thing', id: thing.id, label: thing.displayName, action: `route:/things/${thing.id}` };
  });
  const coco = getPerson('person_coco') ?? people[0];

  if (state === 'empty') {
    return {
      mode: 'chat',
      title: 'Ask Agent',
      conversation: [],
      suggestedPrompts: [
        'Show me things bought for Coco',
        'Which items still have warranty coverage?',
        'What memories are linked to last summer?',
        'Find purchases related to soccer',
      ],
      recentQueries: ['What did I buy for the kitchen recently?', 'Which purchases were with Joe?'],
    };
  }

  if (state === 'premium_gate') {
    return {
      mode: 'chat',
      title: 'Ask Agent',
      conversation: [
        {
          id: 'chat-gate-1',
          role: 'user',
          content: 'Which items still have warranty coverage?',
        },
        {
          id: 'chat-gate-2',
          role: 'assistant',
          content: 'Warranty tracking is available in Personal Pro. Upgrade to keep manuals and coverage attached to your Things.',
          citations: [],
          structuredResults: [],
          upgradeCard: upgradeCard('personal_pro', 'Unlock warranty insights', 'Track active coverage and upcoming expirations across the Things that matter.'),
        },
      ],
      suggestedPrompts: ['Show me recent Things', 'Find the KitchenAid mixer'],
      recentQueries: ['What did I buy for the kitchen recently?'],
    };
  }

  if (state === 'memory_question') {
    return {
      mode: 'chat',
      title: 'Ask Agent',
      conversation: [
        {
          id: 'chat-memory-1',
          role: 'user',
          content: 'Find purchases related to soccer',
        },
        {
          id: 'chat-memory-2',
          role: 'assistant',
          content: 'I found one strong cluster: the Sports Basement receipt, Coco, the Adidas Predator Cleats, and the soccer tournament weekend memory.',
          citations: [
            { type: 'person', id: coco.id, label: coco.displayName, action: `route:/people/${coco.id}` },
            { type: 'receipt', id: 'rcpt_soccer', label: 'Sports Basement receipt', action: 'route:/things/thing_cleats' },
          ],
          structuredResults: [
            {
              id: 'chat-memory-result-1',
              title: 'Soccer tournament weekend',
              body: 'A strong candidate memory linked to Coco and the cleats purchase.',
              actionLabel: 'Open memory',
              action: 'route:/memories/memory_soccer',
              chips: ['Coco', 'Sports Basement', 'Adidas Predator Cleats'],
            },
          ],
          suggestedFollowUps: ['Open Coco', 'Show all things for Coco'],
        },
      ],
      suggestedPrompts: ['What memories are linked to last summer?', 'Show me things bought for Coco'],
      recentQueries: ['Which purchases were with Joe?'],
    };
  }

  const groundedQuery = buildGroundedAgentQuery();
  const groundedAnswer = groundedQuery ? answerSemanticReceiptQuestion(groundedQuery) : null;

  if (groundedAnswer) {
    return {
      mode: 'chat',
      title: 'Ask Agent',
      conversation: [
        {
          id: 'chat-grounded-1',
          role: 'user',
          content: groundedAnswer.query,
        },
        {
          id: 'chat-grounded-2',
          role: 'assistant',
          content: groundedAnswer.summary,
          citations: groundedAnswer.citations.map((citation) => ({
            type: citation.type,
            id: citation.id,
            label: citation.label,
            action: citation.action,
          })),
          structuredResults: groundedAnswer.structuredResults.map((result) => ({
            id: result.id,
            title: result.title,
            body: result.body,
            actionLabel: result.actionLabel,
            action: result.action,
            chips: result.chips,
          })),
          suggestedFollowUps: groundedAnswer.suggestedFollowUps,
        },
      ],
      suggestedPrompts: [
        'What did I buy recently?',
        'Which receipts have durable goods?',
        'Show me the latest trusted receipt',
        'What else did I buy at the same merchant?',
      ],
      recentQueries: [groundedAnswer.query, 'Which purchases were with Joe?', 'What memories are linked to last summer?'],
    };
  }

  return {
    mode: 'chat',
    title: 'Ask Agent',
    conversation: [
      {
        id: 'chat-linked-1',
        role: 'user',
        content: 'Show me things bought for Coco',
      },
      {
        id: 'chat-linked-2',
        role: 'assistant',
        content: 'I found one recent thing clearly bought for Coco: Adidas Predator Cleats from Sports Basement. It is already linked to a soccer weekend memory.',
        citations: [
          { type: 'person', id: coco.id, label: coco.displayName, action: `route:/people/${coco.id}` },
          ...thingCitations.slice(0, 1),
        ],
        structuredResults: [
          {
            id: 'chat-structured-1',
            title: 'Adidas Predator Cleats',
            body: 'Recently added sports gear with an open return window and a linked family-event memory.',
            actionLabel: 'Open Thing',
            action: 'route:/things/thing_cleats',
            chips: ['Coco', 'Return window open', 'Linked to memory'],
          },
          {
            id: 'chat-structured-2',
            title: 'Soccer tournament weekend',
            body: 'The cleats already connect to a candidate memory, so this purchase is no longer just a line item.',
            actionLabel: 'Open Memory',
            action: 'route:/memories/memory_soccer',
            chips: ['Candidate', 'Family event'],
          },
        ],
        suggestedFollowUps: ['Open Coco', 'What else is linked to soccer?', 'Show the receipt'],
      },
    ],
    suggestedPrompts: [
      'Which items still have warranty coverage?',
      'What did I buy for the kitchen recently?',
      'Show me things bought for Coco',
      'Find purchases related to soccer',
    ],
    recentQueries: ['Which purchases were with Joe?', 'What memories are linked to last summer?'],
  };
}

function buildAgentVoicePayload(options: RouteBuilderOptions): AgentVoicePayload {
  const state = options.state ?? 'answered';
  if (state === 'idle') {
    return {
      mode: 'voice',
      title: 'Ask Agent by Voice',
      state: 'idle',
      prompt: 'Ask about purchases, Things, people, or memories.',
      examples: [
        'What still has warranty coverage?',
        'Show me things bought for Coco',
        'What memories are linked to movie nights?',
      ],
    };
  }

  if (state === 'listening' || state === 'processing') {
    return {
      mode: 'voice',
      title: 'Ask Agent by Voice',
      state,
      prompt: state === 'listening' ? 'Listening...' : 'Thinking...',
      examples: ['Find purchases related to soccer', 'What did I buy for the kitchen recently?'],
    };
  }

  const groundedQuery = buildGroundedAgentQuery();
  const groundedAnswer = groundedQuery ? answerSemanticReceiptQuestion(groundedQuery) : null;

  if (groundedAnswer) {
    return {
      mode: 'voice',
      title: 'Ask Agent by Voice',
      state: 'answered',
      transcript: groundedAnswer.query,
      examples: [
        'Show me the latest trusted receipt',
        'Which receipts have durable goods?',
        'What else did I buy at the same merchant?',
      ],
      response: {
        content: groundedAnswer.summary,
        citations: groundedAnswer.citations.map((citation) => ({
          type: citation.type,
          id: citation.id,
          label: citation.label,
          action: citation.action,
        })),
        structuredResults: groundedAnswer.structuredResults.map((result) => ({
          id: result.id,
          title: result.title,
          body: result.body,
          actionLabel: result.actionLabel,
          action: result.action,
          chips: result.chips,
        })),
        suggestedFollowUps: groundedAnswer.suggestedFollowUps,
      },
    };
  }

  return {
    mode: 'voice',
    title: 'Ask Agent by Voice',
    state: 'answered',
    transcript: 'What did I buy for the kitchen recently?',
    examples: [
      'Show me things bought for Coco',
      'Which items still have warranty coverage?',
      'Find purchases related to soccer',
    ],
    response: {
      content: 'The strongest recent kitchen purchase is the KitchenAid Artisan Mixer from Williams Sonoma. It is linked to Shanshan and the Family brunch prep memory.',
      citations: [
        { type: 'thing', id: 'thing_mixer', label: 'KitchenAid Artisan Mixer', action: 'route:/things/thing_mixer' },
        { type: 'memory', id: 'memory_brunch', label: 'Family brunch prep', action: 'route:/memories/memory_brunch' },
      ],
      structuredResults: [
        {
          id: 'voice-result-1',
          title: 'KitchenAid Artisan Mixer',
          body: 'High-value kitchen thing with warranty coverage and a strong memory link.',
          actionLabel: 'Open Thing',
          action: 'route:/things/thing_mixer',
          chips: ['Kitchen', 'Warranty active', 'Linked to memory'],
        },
        {
          id: 'voice-result-2',
          title: 'Family brunch prep',
          body: 'A confirmed memory demonstrating how a purchase became household context.',
          actionLabel: 'Open Memory',
          action: 'route:/memories/memory_brunch',
          chips: ['Confirmed', 'Household ritual'],
        },
      ],
      suggestedFollowUps: ['Open the mixer', 'Who is linked to it?', 'Show the receipt'],
    },
  };
}

function buildGroundedAgentQuery() {
  const latestPurchaseEvent = listProjectedPurchaseEvents()[0];

  if (!latestPurchaseEvent) {
    return null;
  }

  return `What did I buy at ${latestPurchaseEvent.merchantName}?`;
}

export function buildCoreRoutePayload(routeKey: string, options: RouteBuilderOptions) {
  switch (routeKey) {
    case '/home':
      return buildHomePayload(options);
    case '/things':
      return buildThingsPayload(options);
    case '/things/:thingId':
      return buildThingDetailPayload(options);
    case '/people':
      return buildPeoplePayload(options);
    case '/people/:personId':
      return buildPersonDetailPayload(options);
    case '/memories':
      return buildMemoriesPayload(options);
    case '/memories/:memoryId':
      return buildMemoryDetailPayload(options);
    case '/fab-menu':
      return buildFabMenuPayload();
    case '/agent/chat':
      return buildAgentChatPayload(options);
    case '/agent/voice':
      return buildAgentVoicePayload(options);
    case '/ingest/:receiptId':
      return options.params?.receiptId ? getLiveReceiptStudioPayload(options.params.receiptId) : null;
    default:
      return null;
  }
}
