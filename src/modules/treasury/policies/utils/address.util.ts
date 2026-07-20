export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function normalizeAddress(address: string): string {
  return address.toLowerCase();
}

export function truncateAddress(address: string, length = 6): string {
  if (!address || address.length < 10) return address;
  return `${address.substring(0, length)}...${address.substring(address.length - 4)}`;
}
