// Curator-specific Lagoon vaults. Values are read from vault contracts, never from the Lagoon API.
const vaults = {
  ethereum: [
    "0x7d2c2f54792ad72cb834d298f542145b06b703cb", // Murmurr USDC One
  ],
  base: [
    "0x8092ca384d44260ea4feaf7457b629b8dc6f88f0", // DeTrade Core USDC
  ],
};

module.exports = {
  doublecounted: true,
  methodology: "Counts the on-chain totalAssets of DeTrade Core USDC on Base and Murmurr USDC One on Ethereum, denominated in each vault's asset. Core EURC and Core ETH are excluded because their strategies can reinvest into Core USDC; including their full NAV without subtracting internal positions would double count capital.",
};

for (const [chain, calls] of Object.entries(vaults)) {
  module.exports[chain] = {
    tvl: (api) => api.erc4626Sum2({ calls }),
  };
}
