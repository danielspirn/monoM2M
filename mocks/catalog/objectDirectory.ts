export type ObjectDirectoryEntry = {
  id: string;
  keywords: string[];
  category: string;
  subcategory: string;
  householdTags: string[];
  lemTags: string[];
  thingCandidate: boolean;
};

const objectDirectory: ObjectDirectoryEntry[] = [
  {
    id: 'object_air_fryer',
    keywords: ['air fryer'],
    category: 'Kitchen',
    subcategory: 'Appliance',
    householdTags: ['home', 'organization'],
    lemTags: ['continuity', 'home'],
    thingCandidate: true,
  },
  {
    id: 'object_storage_bench',
    keywords: ['storage bench', 'wall hooks', 'entry tray', 'shelf', 'lamp'],
    category: 'Home',
    subcategory: 'Furniture',
    householdTags: ['home', 'organization'],
    lemTags: ['continuity', 'home'],
    thingCandidate: true,
  },
  {
    id: 'object_banana',
    keywords: ['banana', 'granola', 'milk', 'yogurt', 'produce'],
    category: 'Groceries',
    subcategory: 'Food',
    householdTags: ['groceries', 'food_at_home'],
    lemTags: ['nourishment', 'routine'],
    thingCandidate: false,
  },
  {
    id: 'object_cleaning_service',
    keywords: ['bathroom', 'kitchen', 'glass slider', 'dusting', 'mop', 'vacuum', 'cleaning service'],
    category: 'Home services',
    subcategory: 'Cleaning',
    householdTags: ['home', 'shared_household'],
    lemTags: ['continuity', 'home'],
    thingCandidate: false,
  },
];

export function resolveObjectDirectoryEntry(value: string) {
  const normalized = value.toLowerCase();
  return objectDirectory.find((entry) =>
    entry.keywords.some((keyword) => normalized.includes(keyword)),
  ) ?? null;
}

export function listObjectDirectoryEntries() {
  return objectDirectory;
}
