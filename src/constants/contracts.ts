export const OP_GOERLI_CHAIN_ID = 420;
export const GOERLI_CHAIN_ID = 5;

export const CHAIN_ID = process.env.CHAIN_NAME === 'goerli' ? GOERLI_CHAIN_ID : OP_GOERLI_CHAIN_ID;

export const GAME_CONTRACT_ADDRESS = {
    420: '0x89562B036c76d95AA59dDd8965fc759DbcAc74e5',
    5: '0x3b336fd4c908a19378f73f591235be5aeeff64fa',
};

export const VERIFIER_CONTRACT_ADDRESS = {
    420: '0xD02453cE594B80Bc3e04Ea14982E675176498369',
    5: '0xbbE5B840bdBAc4F855a0d068816F154C2003cd68'
};

export const JSON_RPC_URL = {
    420: 'https://goerli.optimism.io',
    5: 'https://goerli.infura.io/v3/',
}

    