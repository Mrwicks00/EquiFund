/**
 * Deployed contract addresses for EquiFund
 * Update these addresses after deploying contracts
 */

export const CONTRACT_ADDRESSES = {
  USDC: "0xF77E2E350D43349cB81F3DF4f982b8039aF1ab5f",
  PROJECT_REGISTRY: "0xD61F4332c0b199C08AC3Fb2D560888C17cc31957",
  SYBIL_GUARD: "0x6F838f3E53FeF5d6b149d6DDD9FaeAc4F6Ff89A1",
  EQUIFUND_POOL: "0x45530E14bFd330C47772E53790C574bB48c9D70d",
} as const;

// Type-safe access to contract addresses
export type ContractName = keyof typeof CONTRACT_ADDRESSES;

// Helper function to get contract address
export const getContractAddress = (contractName: ContractName): string => {
  return CONTRACT_ADDRESSES[contractName];
};

// Export individual addresses for convenience
export const { USDC, PROJECT_REGISTRY, SYBIL_GUARD, EQUIFUND_POOL } =
  CONTRACT_ADDRESSES;
