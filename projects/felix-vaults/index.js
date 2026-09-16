const { getCuratorTvl, getMorphoVaults } = require("../helper/curators");

const hyperliquidConfig = {
  governor: "0x4A827418D632C415E19825fd011283A4ba020B3A",
}

async function tvl(api) {
  // Shared discovery now covers both the V1 and V2 HyperEVM factories.
  const allVaults = await getMorphoVaults(api, [], { getAllVaults: true })
  const owners = await api.multiCall({ abi: 'address:owner', calls: allVaults })
  const vaults = allVaults.filter((_, i) => owners[i].toLowerCase() === hyperliquidConfig.governor.toLowerCase())

  return getCuratorTvl(api, { morpho: vaults })
}

module.exports = {
  doublecounted: true,
  hyperliquid: {
    tvl,
  },
}
