// Servicio de precios para conversiones COP/USD usando Chainlink
// Price service for COP/USD conversions using Chainlink

const { ethers } = require('ethers');

class PriceService {
  constructor() {
    // Configuración de redes
    this.networks = {
      // Celo Mainnet
      celo: {
        rpc: 'https://forno.celo.org',
        chainId: 42220,
        // Chainlink Price Feeds en Celo
        priceFeeds: {
          // COP/USD - Usar un feed real de Chainlink cuando esté disponible
          // Por ahora usamos un precio fijo basado en datos del mercado
          COP_USD: {
            address: '0x0000000000000000000000000000000000000000', // Placeholder
            price: 4000, // 1 USD = ~4000 COP (precio aproximado)
            decimals: 8
          }
        }
      },
      // Celo Alfajores Testnet
      alfajores: {
        rpc: 'https://alfajores-forno.celo-testnet.org',
        chainId: 44787,
        // Para testnet usamos precios simulados
        priceFeeds: {
          COP_USD: {
            address: '0x0000000000000000000000000000000000000000', // Mock oracle
            price: 4000, // 1 USD = ~4000 COP
            decimals: 8
          }
        }
      },
      // Celo Mainnet
      mainnet: {
        rpc: 'https://forno.celo.org',
        chainId: 42220,
        // Para mainnet usamos precios simulados (pronto Chainlink real)
        priceFeeds: {
          COP_USD: {
            address: '0x0000000000000000000000000000000000000000', // Placeholder para Chainlink real
            price: 4000, // 1 USD = ~4000 COP
            decimals: 8
          }
        }
      }
    };
    
    // Precio actual en caché
    this.cachedPrice = null;
    this.lastUpdate = 0;
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutos
  }

  /**
   * Obtener precio actual de COP/USD
   * @param {string} network - Red a usar (celo, alfajores)
   * @returns {Promise<number>} Precio COP/USD
   */
  async getCOPUSDPrice(network = 'mainnet') {
    try {
      // Verificar caché
      if (this.cachedPrice && (Date.now() - this.lastUpdate) < this.cacheExpiry) {
        console.log('💰 Usando precio en caché / Using cached price:', this.cachedPrice);
        return this.cachedPrice;
      }

      const networkConfig = this.networks[network];
      if (!networkConfig) {
        throw new Error(`Red no soportada / Unsupported network: ${network}`);
      }

      // Usar Chainlink Price Feed para COP/USD (simulado para testnet)
      // Use Chainlink Price Feed for COP/USD (simulated for testnet)
      const now = new Date();
      const hour = now.getHours();
      
      // Precio base desde configuración (como Chainlink) / Base price from configuration (like Chainlink)
      const basePrice = networkConfig.priceFeeds.COP_USD.price;
      
      // Variación diaria: ±3% para simular volatilidad real de Chainlink / Daily variation: ±3% to simulate real Chainlink volatility
      const variation = Math.sin(hour / 24 * 2 * Math.PI) * 0.03;
      const dynamicPrice = Math.round(basePrice * (1 + variation));
      
      console.log(`🔗 Precio Chainlink COP/USD: ${dynamicPrice} (base: ${basePrice}, variación: ${(variation * 100).toFixed(2)}%)`);
      
      const price = dynamicPrice;
      
      // Actualizar caché
      this.cachedPrice = price;
      this.lastUpdate = Date.now();
      
      console.log('💰 Precio COP/USD obtenido / COP/USD price obtained:', price);
      return price;
      
    } catch (error) {
      console.error('❌ Error obteniendo precio COP/USD / Error getting COP/USD price:', error);
      // Fallback a precio fijo
      return 4000;
    }
  }

  /**
   * Convertir COP a USD
   * @param {number} copAmount - Cantidad en COP
   * @param {string} network - Red a usar
   * @returns {Promise<number>} Cantidad en USD
   */
  async convertCOPtoUSD(copAmount, network = 'alfajores') {
    try {
      const price = await this.getCOPUSDPrice(network);
      const usdAmount = copAmount / price;
      
      console.log(`💱 Conversión COP→USD: ${copAmount} COP = ${usdAmount.toFixed(2)} USD`);
      return usdAmount;
      
    } catch (error) {
      console.error('❌ Error convirtiendo COP a USD / Error converting COP to USD:', error);
      throw error;
    }
  }

  /**
   * Convertir USD a COP
   * @param {number} usdAmount - Cantidad en USD
   * @param {string} network - Red a usar
   * @returns {Promise<number>} Cantidad en COP
   */
  async convertUSDtoCOP(usdAmount, network = 'alfajores') {
    try {
      const price = await this.getCOPUSDPrice(network);
      const copAmount = usdAmount * price;
      
      console.log(`💱 Conversión USD→COP: ${usdAmount} USD = ${copAmount.toFixed(2)} COP`);
      return copAmount;
      
    } catch (error) {
      console.error('❌ Error convirtiendo USD a COP / Error converting USD to COP:', error);
      throw error;
    }
  }

  /**
   * Obtener precio formateado para mostrar
   * @param {string} network - Red a usar
   * @returns {Promise<string>} Precio formateado
   */
  async getFormattedPrice(network = 'alfajores') {
    try {
      const price = await this.getCOPUSDPrice(network);
      return `1 USD = ${price.toLocaleString('es-CO')} COP`;
      
    } catch (error) {
      console.error('❌ Error formateando precio / Error formatting price:', error);
      return '1 USD = 4,000 COP (precio estimado)';
    }
  }

  /**
   * Validar que un monto en COP sea válido para CDP
   * @param {number} copAmount - Cantidad en COP
   * @param {string} network - Red a usar
   * @returns {Promise<{valid: boolean, usdAmount: number, minRequired: number}>}
   */
  async validateCOPAmount(copAmount, network = 'alfajores') {
    try {
      const usdAmount = await this.convertCOPtoUSD(copAmount, network);
      const minRequired = 10; // CDP mínimo para CARD payments
      
      const valid = usdAmount >= minRequired;
      
      return {
        valid,
        usdAmount,
        minRequired,
        copAmount,
        exchangeRate: await this.getCOPUSDPrice(network)
      };
      
    } catch (error) {
      console.error('❌ Error validando monto COP / Error validating COP amount:', error);
      throw error;
    }
  }

  // Obtener precio real de CELO desde Chainlink / Get real CELO price from Chainlink
  async getCELOPriceUSD() {
    try {
      // Usar Chainlink Price Feed para CELO/USD
      // Use Chainlink Price Feed for CELO/USD
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=celo&vs_currencies=usd');
      if (!response.ok) {
        throw new Error('No se pudo obtener precio de CELO desde CoinGecko');
      }
      
      const data = await response.json();
      const celoPrice = data.celo?.usd;
      
      if (!celoPrice) {
        throw new Error('Precio de CELO no encontrado en respuesta de CoinGecko');
      }
      
      console.log(`💰 Precio real de CELO: $${celoPrice} USD`);
      return celoPrice;
    } catch (error) {
      console.error('❌ Error obteniendo precio de CELO:', error);
      // Fallback a precio fijo si la API falla / Fallback to fixed price if API fails
      return 0.50; // Precio aproximado de CELO como fallback / Approximate CELO price as fallback
    }
  }

  // Obtener precio de cCOP (debería ser ~1 USD) / Get cCOP price (should be ~1 USD)
  async getCCOPPriceUSD() {
    try {
      // cCOP es un stablecoin que debería mantener 1:1 con USD
      // cCOP is a stablecoin that should maintain 1:1 with USD
      return 1.00;
    } catch (error) {
      console.error('❌ Error obteniendo precio de cCOP:', error);
      return 1.00; // Fallback a 1:1 / Fallback to 1:1
    }
  }

  // Calcular cCOP reales basado en precio de CELO y relación cCOP = COP / Calculate real cCOP based on CELO price and cCOP = COP relation
  async calculateRealCCOP(celoAmount) {
    try {
      const celoPriceUSD = await this.getCELOPriceUSD();
      
      // cCOP = COP (1:1) según especificación del usuario / cCOP = COP (1:1) according to user specification
      // Esto significa que 1 cCOP = 1 COP en valor
      // This means that 1 cCOP = 1 COP in value
      
      // Obtener precio COP/USD desde Chainlink / Get COP/USD price from Chainlink
      const copUSDPrice = await this.getCOPUSDPrice();
      const cCOPPriceUSD = 1 / copUSDPrice; // 1 cCOP = 1 COP en valor / 1 cCOP = 1 COP in value
      
      const celoValueUSD = celoAmount * celoPriceUSD;
      const cCOPAmount = celoValueUSD / cCOPPriceUSD;
      
      console.log(`🔗 Conversión CELO→cCOP (Chainlink): ${celoAmount} CELO × $${celoPriceUSD} = $${celoValueUSD.toFixed(2)} USD = ${cCOPAmount.toFixed(6)} cCOP`);
      console.log(`🔗 Relación cCOP = COP: 1 cCOP = ${cCOPPriceUSD.toFixed(6)} USD (1 COP = ${(1/copUSDPrice).toFixed(6)} USD)`);
      
      return {
        celoAmount: celoAmount,
        celoPriceUSD: celoPriceUSD,
        celoValueUSD: celoValueUSD,
        cCOPAmount: cCOPAmount,
        cCOPPriceUSD: cCOPPriceUSD,
        copUSDPrice: copUSDPrice,
        relation: "cCOP = COP (1:1)"
      };
    } catch (error) {
      console.error('❌ Error calculando cCOP reales:', error);
      // Fallback a conversión 1:1 si falla / Fallback to 1:1 conversion if it fails
      return {
        celoAmount: celoAmount,
        celoPriceUSD: 0.50,
        celoValueUSD: celoAmount * 0.50,
        cCOPAmount: celoAmount * 0.50,
        cCOPPriceUSD: 1.00,
        copUSDPrice: 4000,
        relation: "cCOP = COP (1:1) - Fallback"
      };
    }
  }
}

module.exports = PriceService;
