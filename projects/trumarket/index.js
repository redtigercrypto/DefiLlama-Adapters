// Curator-specific Lagoon vaults. Values are read from vault contracts, never from the Lagoon API.
const vaults = {
  base: [
    "0xbe7db44f4ce20dac83b578b94fd35087f66e9754", // TruMarket
  ],
};

module.exports = {
  doublecounted: true,
  methodology: "Counts on-chain totalAssets, denominated in USDC, of the TruMarket Lagoon vault on Base. This NAV is applied by the vault valuation and settlement process and overlaps with Lagoon.",
};

for (const [chain, calls] of Object.entries(vaults)) {
  module.exports[chain] = {
    tvl: (api) => api.erc4626Sum2({ calls }),
  };
}
