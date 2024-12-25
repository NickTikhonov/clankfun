
const blacklist = [
  "0x20aea0aa0c44023ecc4da45b15b3747565128945" // Clanker Christmas Hoe
]

export function isCABlacklisted(address: string): boolean {
  const lowercased = address.toLowerCase();
  const lowercasedBlacklist = blacklist.map((address) => address.toLowerCase());

  return lowercasedBlacklist.includes(lowercased);
}