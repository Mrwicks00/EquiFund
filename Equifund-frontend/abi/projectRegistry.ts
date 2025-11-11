export const PROJECT_REGISTRY_ABI = [
  { type: "constructor", inputs: [], stateMutability: "nonpayable" },
  {
    type: "function",
    name: "batchRegisterProjects",
    inputs: [
      { name: "projectAddrs", type: "address[]", internalType: "address[]" },
      { name: "names", type: "string[]", internalType: "string[]" },
      { name: "descriptions", type: "string[]", internalType: "string[]" },
      { name: "metadataURIs", type: "string[]", internalType: "string[]" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getActiveProjects",
    inputs: [],
    outputs: [
      { name: "active", type: "address[]", internalType: "address[]" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getAllProjects",
    inputs: [],
    outputs: [
      { name: "", type: "address[]", internalType: "address[]" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getProject",
    inputs: [
      { name: "projectAddr", type: "address", internalType: "address" },
    ],
    outputs: [
      {
        name: "project",
        type: "tuple",
        internalType: "struct ProjectRegistry.Project",
        components: [
          { name: "projectAddress", type: "address", internalType: "address" },
          { name: "name", type: "string", internalType: "string" },
          { name: "description", type: "string", internalType: "string" },
          { name: "metadataURI", type: "string", internalType: "string" },
          { name: "isActive", type: "bool", internalType: "bool" },
          { name: "registeredAt", type: "uint256", internalType: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getProjectCount",
    inputs: [],
    outputs: [
      { name: "", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getProjectDescription",
    inputs: [
      { name: "projectAddr", type: "address", internalType: "address" },
    ],
    outputs: [
      { name: "description", type: "string", internalType: "string" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getProjectMetadataURI",
    inputs: [
      { name: "projectAddr", type: "address", internalType: "address" },
    ],
    outputs: [
      { name: "uri", type: "string", internalType: "string" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getProjectName",
    inputs: [
      { name: "projectAddr", type: "address", internalType: "address" },
    ],
    outputs: [
      { name: "name", type: "string", internalType: "string" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getProjectRegisteredAt",
    inputs: [
      { name: "projectAddr", type: "address", internalType: "address" },
    ],
    outputs: [
      { name: "timestamp", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isProjectActive",
    inputs: [
      { name: "projectAddr", type: "address", internalType: "address" },
    ],
    outputs: [
      { name: "", type: "bool", internalType: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isProjectRegistered",
    inputs: [
      { name: "projectAddr", type: "address", internalType: "address" },
    ],
    outputs: [
      { name: "", type: "bool", internalType: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [
      { name: "", type: "address", internalType: "address" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "projectList",
    inputs: [
      { name: "", type: "uint256", internalType: "uint256" },
    ],
    outputs: [
      { name: "", type: "address", internalType: "address" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "projects",
    inputs: [
      { name: "", type: "address", internalType: "address" },
    ],
    outputs: [
      { name: "projectAddress", type: "address", internalType: "address" },
      { name: "name", type: "string", internalType: "string" },
      { name: "description", type: "string", internalType: "string" },
      { name: "metadataURI", type: "string", internalType: "string" },
      { name: "isActive", type: "bool", internalType: "bool" },
      { name: "registeredAt", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "registerProject",
    inputs: [
      { name: "projectAddr", type: "address", internalType: "address" },
      { name: "name", type: "string", internalType: "string" },
      { name: "description", type: "string", internalType: "string" },
      { name: "metadataURI", type: "string", internalType: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "removeProject",
    inputs: [
      { name: "projectAddr", type: "address", internalType: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "renounceOwnership",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "toggleProjectStatus",
    inputs: [
      { name: "projectAddr", type: "address", internalType: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "transferOwnership",
    inputs: [
      { name: "newOwner", type: "address", internalType: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "updateProject",
    inputs: [
      { name: "projectAddr", type: "address", internalType: "address" },
      { name: "name", type: "string", internalType: "string" },
      { name: "description", type: "string", internalType: "string" },
      { name: "metadataURI", type: "string", internalType: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "OwnershipTransferred",
    inputs: [
      {
        name: "previousOwner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      { name: "newOwner", type: "address", indexed: true, internalType: "address" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "ProjectRegistered",
    inputs: [
      {
        name: "projectAddress",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      { name: "name", type: "string", indexed: false, internalType: "string" },
      { name: "timestamp", type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "ProjectRemoved",
    inputs: [
      {
        name: "projectAddress",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "ProjectStatusChanged",
    inputs: [
      {
        name: "projectAddress",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      { name: "isActive", type: "bool", indexed: false, internalType: "bool" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "ProjectUpdated",
    inputs: [
      {
        name: "projectAddress",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      { name: "name", type: "string", indexed: false, internalType: "string" },
    ],
    anonymous: false,
  },
  {
    type: "error",
    name: "OwnableInvalidOwner",
    inputs: [
      { name: "owner", type: "address", internalType: "address" },
    ],
  },
  {
    type: "error",
    name: "OwnableUnauthorizedAccount",
    inputs: [
      { name: "account", type: "address", internalType: "address" },
    ],
  },
] as const;

export type ProjectRegistryAbi = typeof PROJECT_REGISTRY_ABI;
