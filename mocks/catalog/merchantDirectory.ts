export type MerchantDirectoryEntry = {
  id: string;
  displayName: string;
  aliases: string[];
  kind: 'retailer' | 'service_provider' | 'restaurant' | 'marketplace';
  retailerProfile: 'known retailer' | 'known service provider' | 'new retailer';
  defaultReturnWindowDays?: number;
  defaultProductCategories: string[];
};

const merchantDirectory: MerchantDirectoryEntry[] = [
  {
    id: 'merchant_safeway',
    displayName: 'Safeway',
    aliases: ['safeway', 'safeway store'],
    kind: 'retailer',
    retailerProfile: 'known retailer',
    defaultReturnWindowDays: 30,
    defaultProductCategories: ['Groceries'],
  },
  {
    id: 'merchant_target',
    displayName: 'Target',
    aliases: ['target'],
    kind: 'retailer',
    retailerProfile: 'known retailer',
    defaultReturnWindowDays: 30,
    defaultProductCategories: ['Home', 'General merchandise'],
  },
  {
    id: 'merchant_trader_joes',
    displayName: "Trader Joe's",
    aliases: ['trader joe', "trader joe's"],
    kind: 'retailer',
    retailerProfile: 'known retailer',
    defaultReturnWindowDays: 30,
    defaultProductCategories: ['Groceries'],
  },
  {
    id: 'merchant_daniel_stone',
    displayName: 'Daniel Stone',
    aliases: ['daniel stone', 'cleaning invoice', 'house cleaning'],
    kind: 'service_provider',
    retailerProfile: 'known service provider',
    defaultProductCategories: ['Home services'],
  },
];

export function resolveMerchantDirectoryEntry(merchant: string) {
  const normalized = merchant.toLowerCase();
  return merchantDirectory.find((entry) =>
    entry.aliases.some((alias) => normalized.includes(alias)),
  ) ?? null;
}

export function listMerchantDirectoryEntries() {
  return merchantDirectory;
}
