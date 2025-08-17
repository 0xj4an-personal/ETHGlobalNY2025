// Configuración para Celo Alfajores Testnet
module.exports = {
  // Red Celo Alfajores Testnet
  network: {
    name: 'alfajores',
    chainId: 44787,
    rpcUrl: 'https://alfajores-forno.celo-testnet.org',
    explorer: 'https://alfajores.celoscan.io'
  },
  
  // Tokens en Alfajores Testnet
  tokens: {
    CELO: '0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9',
    CUSD: '0x874069Fa1Eb16D44d622F2e0fA25b6c482d98A93',
    // cCOP no está disponible en testnet, usaremos cUSD como simulación
    CCOP: '0x874069Fa1Eb16D44d622F2e0fA25b6c482d98A93' // Simulamos con cUSD
  },
  
  // Uniswap V3 en Alfajores (si existe)
  uniswap: {
    router: '0x0000000000000000000000000000000000000000', // Pendiente verificar
    factory: '0x0000000000000000000000000000000000000000'  // Pendiente verificar
  },
  
  // Configuración de CDP para testnet
  cdp: {
    appId: '5e724356-f66f-45d2-accf-c0b562fd2edd',
    apiKey: '38ee86f8-1e30-42a1-8125-bed547762b21',
    privateKey: 'r5qehxv90t95wO1Xm/Q6G8V/cK8E3tgt8x/udLuzma6joijqcUUCMGU1OMi9++0IWzld/i4+y3aJZor+7KI8Cg==',
    // Para testnet, usamos US como país y USD como moneda
    country: 'US',
    paymentCurrency: 'USD',
    paymentMethod: 'CARD'
  }
};
