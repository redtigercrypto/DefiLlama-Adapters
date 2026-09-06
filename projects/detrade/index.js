// Official vaults and roles: https://app.lagoon.finance/curators/detrade
// Strategy nesting: https://docs.detrade.fund/vaults
const sdk = require('@defillama/sdk')

const config = {
  ethereum: ['0x7d2c2f54792ad72cb834d298f542145b06b703cb'], // Morpho X-Chain USDC
  base: [
    '0x8092ca384d44260ea4feaf7457b629b8dc6f88f0', // Core USDC
    '0x9b97bfdfe44d1b113ecd4bf2f243ed36aca34523', // Core ETH
    '0xd4401d8bea82e4e6c40bb26ae3a04d2fb7ca4550', // Core EURC
  ],
}

async function tvl(api) {
  // A Base fund can hold shares of the Ethereum fund through its Safe at the
  // same address on Ethereum. Discover all current Safes, not just local ones.
  const safes = (await Promise.all(Object.entries(config).map(async ([chain, calls]) => {
    const chainApi = chain === api.chain ? api : new sdk.ChainApi({ chain, timestamp: api.timestamp })
    return chainApi.multiCall({ abi: 'address:safe', calls })
  }))).flat()
  const owners = [...new Set([...safes, ...Object.values(config).flat()].map(x => x.toLowerCase()))]
  const vaults = config[api.chain]
  const [assets, totals, ownSafes] = await Promise.all([
    api.multiCall({ abi: 'address:asset', calls: vaults }),
    api.multiCall({ abi: 'uint256:totalAssets', calls: vaults }),
    api.multiCall({ abi: 'address:safe', calls: vaults }),
  ])
  for (let i = 0; i < vaults.length; i++) {
    // Shares pending a claim/redemption inside their own vault are not a
    // second investment. Only remove shares held by other included funds.
    const otherOwners = owners.filter(o => o !== vaults[i].toLowerCase() && o !== ownSafes[i].toLowerCase())
    const shares = await api.multiCall({ abi: 'erc20:balanceOf', calls: otherOwners.map(owner => ({ target: vaults[i], params: owner })) })
    const nestedShares = shares.reduce((sum, balance) => sum + BigInt(balance), 0n)
    const nestedAssets = nestedShares === 0n ? 0n : BigInt(await api.call({ target: vaults[i], abi: 'function convertToAssets(uint256) view returns (uint256)', params: nestedShares.toString() }))
    if (nestedAssets > BigInt(totals[i])) throw new Error('Nested assets exceed vault NAV')
    api.add(assets[i], BigInt(totals[i]) - nestedAssets)
  }
}

module.exports = {
  doublecounted: true,
  methodology: 'Sum settled Lagoon fund NAV, subtracting shares held by other DeTrade funds including cross-chain Safe holdings.',
  ethereum: { tvl },
  base: { tvl },
}
