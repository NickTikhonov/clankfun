
const blacklist = [
  "0x20aea0aa0c44023ecc4da45b15b3747565128945", // Clanker Christmas Hoe
  "0x348409fa3651d4cf8571db6bdfaadd3df35987cd" // Billy (huge mcap)
]

export function isCABlacklisted(address: string): boolean {
  const lowercased = address.toLowerCase();
  const lowercasedBlacklist = blacklist.map((address) => address.toLowerCase());

  return lowercasedBlacklist.includes(lowercased);
}