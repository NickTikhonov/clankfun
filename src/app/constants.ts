export const CLANKFUN_BALANCE_GATE = 1 * 1000 * 1000 // 5 Million
export const CLANKFUN_CA = '0x1d008f50fb828ef9debbbeae1b71fffe929bf317'
export const CLANKFUN_CAST_HASH = "clank.fun deployment"
export const SPLIT_CAST_HASH = "split-a-clank deployment"

export function isValidCastHash(hash: string): boolean {
  return hash != CLANKFUN_CAST_HASH && hash != SPLIT_CAST_HASH
}