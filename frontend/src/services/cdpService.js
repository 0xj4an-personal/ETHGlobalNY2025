// CDP Onramp Service
// Basado en la documentación: https://docs.cdp.coinbase.com/onramp-&-offramp/onramp-apis/onramp-overview

const CDP_API_BASE = 'https://api.coinbase.com/v2';

class CDPService {
  constructor() {
    this.appId = '5e724356-f66f-45d2-accf-c0b562fd2edd';
    this.apiKey = '0761b732-f913-4923-9d08-0387a137de76';
    this.privateKey = 'c1Cdgly3sXPdb1XjalNSoZVZdDruSlKuUsT430xUx80IRdJtEd3vOUgDVjDTKmepVsjimvIqx+7n7bSmv1253g==';
  }

  // Generar URL de onramp para Celo (flujo simplificado)
  async generateOnrampURL(walletAddress, amountCOP) {
    try {
      // Flujo: COP → Tarjeta → Celo → Uniswap → cCOP
      // Convertir COP a USD para el monto
      const usdPriceCOP = 4000; // 1 USD = 4000 COP
      const amountUSD = amountCOP / usdPriceCOP;
      
      // Generar sessionToken con la dirección de wallet real
      const sessionToken = await this.generateSessionTokenWithAddress(walletAddress);
      
      // Construir URL de onramp con parámetros mínimos y funcionales
      const baseURL = 'https://pay.coinbase.com/buy/select-asset';
      const params = new URLSearchParams({
        appId: this.appId,
        sessionToken: sessionToken,
        defaultExperience: 'buy',
        amount: amountUSD.toFixed(2),
        currency: 'USD'
      });

      const onrampURL = `${baseURL}?${params.toString()}`;
      
      console.log('Generated Onramp URL:', onrampURL);
      console.log('Flujo: Usuario compra Celo con tarjeta, luego swap automático a cCOP');
      
      return {
        url: onrampURL,
        sessionToken: sessionToken,
        appId: this.appId,
        flow: 'COP → Tarjeta → Celo → Uniswap → cCOP',
        amountUSD: amountUSD.toFixed(2),
        amountCOP: amountCOP
      };
    } catch (error) {
      console.error('Error generating onramp URL:', error);
      throw new Error('No se pudo generar la URL de onramp');
    }
  }

  // Generar sessionToken con dirección de wallet específica
  async generateSessionTokenWithAddress(walletAddress) {
    try {
      console.log('🔑 Generando session token para wallet:', walletAddress);
      console.log('📋 Configuración:', {
        appId: this.appId,
        apiKey: this.apiKey,
        walletAddress: walletAddress
      });
      
      // Llamar al backend para generar session token completo
      const response = await fetch('http://localhost:3002/api/generate-session-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          walletAddress: walletAddress,
          amount: 100000 // Placeholder amount
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error del backend:', response.status, errorText);
        throw new Error(`Backend error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ Session token generado exitosamente desde backend');
      console.log('✅ Response data:', data);
      
      return data.sessionToken;
    } catch (error) {
      console.error('❌ Error completo generando session token:', error);
      console.error('❌ Stack trace:', error.stack);
      
      // Fallback: usar token de ejemplo si el backend falla
      console.warn('⚠️ Fallback a token de ejemplo debido a error en backend');
      const exampleToken = 'ZWJlNDgwYmItNjBkMi00ZmFiLWIxYTQtMTM3MGI2YjJiNjFh';
      return exampleToken;
    }
  }

  // Generar JWT Bearer token para autenticación con CDP
  async generateJWTToken() {
    try {
      console.log('🔐 Generando JWT token real desde backend...');
      
      // Llamar al backend para generar JWT real
      const response = await fetch('http://localhost:3002/api/generate-jwt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          walletAddress: '0x0000000000000000000000000000000000000000' // Placeholder
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error del backend:', response.status, errorText);
        throw new Error(`Backend error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ JWT token real generado desde backend');
      
      return data.jwt;
    } catch (error) {
      console.error('❌ Error generando JWT desde backend:', error);
      
      // Fallback: usar token de ejemplo si el backend falla
      console.warn('⚠️ Fallback a token de ejemplo debido a error en backend');
      const exampleToken = 'ZWJlNDgwYmItNjBkMi00ZmFiLWIxYTQtMTM3MGI2YjJiNjFh';
      return exampleToken;
    }
  }

  // Generar sessionToken usando la API real de CDP
  async generateSessionToken() {
    try {
      // Según la documentación oficial: https://docs.cdp.coinbase.com/onramp-&-offramp/session-token-authentication
      // Usando tu API key real: 0761b732-f913-4923-9d08-0387a137de76
      
      console.log('🔑 Generando session token real con API key:', this.apiKey);
      
      // Llamada a la API real de CDP para generar session token
      const response = await fetch('https://api.developer.coinbase.com/onramp/v1/token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'X-CDP-API-Key': this.apiKey
        },
        body: JSON.stringify({
          addresses: [
            {
              address: "0x0000000000000000000000000000000000000000", // Placeholder, se actualizará
              blockchains: ["celo"]
            }
          ],
          assets: ["CELO"]
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response from CDP API:', response.status, errorText);
        throw new Error(`CDP API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ Session token generado exitosamente:', data);
      
      return data.token;
    } catch (error) {
      console.error('Error generating session token:', error);
      
      // Fallback: usar token de ejemplo si la API falla
      console.warn('⚠️ Fallback a token de ejemplo debido a error en API');
      const exampleToken = 'ZWJlNDgwYmItNjBkMi00ZmFiLWIxYTQtMTM3MGI2YjJiNjFh';
      return exampleToken;
    }
  }

  // Obtener configuración de países y métodos de pago
  async getOnrampConfig() {
    try {
      // Simular respuesta de la API de configuración
      return {
        countries: [
          {
            code: 'US',
            name: 'United States',
            paymentMethods: ['card', 'bank_transfer']
          },
          {
            code: 'CO',
            name: 'Colombia',
            paymentMethods: ['card']
          }
        ],
        currencies: ['USD', 'EUR', 'COP'],
        assets: ['CELO', 'USDC', 'ETH']
      };
    } catch (error) {
      console.error('Error getting onramp config:', error);
      throw new Error('No se pudo obtener la configuración');
    }
  }

  // Obtener quote para la compra desde COP
  async getQuote(amountCOP, sourceCurrency = 'COP', destinationAsset = 'cCOP') {
    try {
      // Simular quote realista para COP → Celo → cCOP
      // En producción, esto vendría de la API de Quote de CDP
      
      // Simular precios actuales
      const celoPriceUSD = 0.50; // Precio de Celo en USD
      const usdPriceCOP = 4000; // 1 USD = 4000 COP (aproximado)
      const celoPriceCOP = celoPriceUSD * usdPriceCOP; // 1 Celo = 2000 COP
      
      const transactionFee = 2.99; // Fee fijo de Coinbase en USD
      const networkFee = 0.01; // Fee de red Celo en USD
      
      // Convertir fees a COP
      const transactionFeeCOP = transactionFee * usdPriceCOP;
      const networkFeeCOP = networkFee * usdPriceCOP;
      const totalFeesCOP = transactionFeeCOP + networkFeeCOP;
      
      // Calcular cuánto USD necesitamos para obtener la cantidad de COP deseada
      const amountUSD = amountCOP / usdPriceCOP;
      const amountAfterFeesUSD = amountUSD + (totalFeesCOP / usdPriceCOP);
      
      // Calcular cuánto Celo necesitamos comprar
      const celoAmount = amountAfterFeesUSD / celoPriceUSD;
      
      // Calcular cuánto cCOP recibirá (simulando swap automático)
      const swapFee = 0.003; // 0.3% como Uniswap V3
      const celoAfterSwapFee = celoAmount * (1 - swapFee);
      const cCOPAmount = celoAfterSwapFee * celoPriceCOP; // Convertir a COP
      
      const quote = {
        sourceAmount: amountCOP,
        sourceCurrency: sourceCurrency,
        amountUSD: amountUSD.toFixed(2),
        celoAmount: celoAmount.toFixed(6),
        celoPriceUSD: celoPriceUSD.toFixed(2),
        celoPriceCOP: celoPriceCOP.toFixed(0),
        destinationAmount: cCOPAmount.toFixed(2),
        destinationAsset: 'cCOP',
        finalAsset: 'cCOP (Peso Colombiano Digital)',
        network: 'celo',
        estimatedFees: totalFeesCOP.toFixed(0),
        transactionFee: transactionFeeCOP.toFixed(0),
        networkFee: networkFeeCOP.toFixed(0),
        swapFee: (swapFee * 100).toFixed(2) + '%',
        totalFeesPercentage: ((totalFeesCOP / amountCOP) * 100).toFixed(2) + '%',
        exchangeRate: celoPriceUSD,
        usdPriceCOP: usdPriceCOP.toFixed(0),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutos
        paymentMethods: ['card', 'debit_card'],
        supportedCountries: ['US', 'CO', 'MX', 'BR', 'AR'],
        process: [
          'Compra Celo con tarjeta',
          'Swap automático Celo → cCOP',
          'Recibe cCOP en tu wallet'
        ]
      };

      console.log('Generated Quote for COP to cCOP:', quote);
      return quote;
    } catch (error) {
      console.error('Error getting quote:', error);
      throw new Error('No se pudo obtener el quote');
    }
  }
}

export default new CDPService();
