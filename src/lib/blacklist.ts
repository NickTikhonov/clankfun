import { ClankerWithDataAndBalance, type ClankerWithData } from "~/app/server";

const blacklist = [
  "0x20aea0aa0c44023ecc4da45b15b3747565128945", // Clanker Christmas Hoe
  "0x348409fa3651d4cf8571db6bdfaadd3df35987cd", // Billy (huge mcap)
  "0x0a8753e39d5805bab0e570dd1974ee43f90799a8", // Clankerdoge
  "0x0c05dc92915185f5929a3ff2fe8acfb1b1f7184e", // Based clank
  "0x1246a1155e417cf95d7c79a6ac1a7c325cc47f4c", // Doge AI meme
  "0x33d5868a4c40c82b90c0ba260e4982c3410decc5", // Bacon egg cheese
  // "0x2d57c47bc5d2432feeedf2c9150162a9862d3ccf", // Temp NSFW test
  // "0x2f6c17fa9f9bc3600346ab4e48c0701e1d5962ae", // Temp NSFW test
  // "0x075b25fae35b121b5295b7fa779e73094b2e9153", // Temp NSFW test
]

export function filterBlacklisted(clankers: ClankerWithData[]): ClankerWithData[] {
  return clankers.filter((clanker) => !blacklist.includes(clanker.contract_address));
}

export function filterBlacklistedWithBlanace(clankers: ClankerWithDataAndBalance[]): ClankerWithDataAndBalance[] {
  return clankers.filter((clanker) => !blacklist.includes(clanker.contract_address));
}

export function isCABlacklisted(address: string): boolean {
  const lowercased = address.toLowerCase();
  const lowercasedBlacklist = blacklist.map((address) => address.toLowerCase());

  return lowercasedBlacklist.includes(lowercased);
}