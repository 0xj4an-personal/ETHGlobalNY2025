// CDP Onramp Service
// Basado en la documentación: https://docs.cdp.coinbase.com/onramp-&-offramp/onramp-apis/onramp-overview

import ensService from './ensService.js';

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
      // Usar COP directamente en la URL de Coinbase
      
      // Generar URL de onramp directamente sin session token
      const baseURL = 'https://pay.coinbase.com/buy/select-asset';
      const params = new URLSearchParams({
        appId: this.appId,
        amount: amountCOP.toString(),
        currency: 'COP',  // ✅ Usar COP directamente
        destinationAddress: walletAddress,
        purchaseCurrency: 'CELO',
        purchaseNetwork: 'celo'
      });

      const onrampURL = `${baseURL}?${params.toString()}`;
      
      console.log('Generated Onramp URL:', onrampURL);
      console.log('Flujo: Usuario compra Celo con COP, luego swap automático a cCOP');
      
      return {
        url: onrampURL,
        appId: this.appId,
        flow: 'COP → Tarjeta → Celo → Uniswap → cCOP',
        amountCOP: amountCOP,
        currency: 'COP',
        method: 'Direct URL Generation'
      };
    } catch (error) {
      console.error('Error generating onramp URL:', error);
      throw new Error('No se pudo generar la URL de onramp');
    }
  }

  // Generar sessionToken con dirección de wallet específica
  async generateSessionTokenWithAddress(walletAddress, amount) {
    try {
      console.log('🔑 Generando session token para wallet:', walletAddress, 'amount:', amount);
      
      // Resolver ENS si es necesario
      let resolvedAddress = walletAddress;
      try {
        resolvedAddress = await ensService.resolveAndValidateAddress(walletAddress, 'celo');
        console.log('✅ Dirección resuelta y validada:', resolvedAddress);
      } catch (ensError) {
        console.warn('⚠️ Error resolviendo ENS, usando dirección original:', ensError.message);
        // Continuar con la dirección original si ENS falla
      }
      
      // Llamar al backend para generar session token completo
      const response = await fetch('http://localhost:3002/api/generate-session-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          walletAddress: resolvedAddress,
          amount: amount
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
      throw error; // No más fallback - queremos ver errores reales
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
      throw error; // No más fallback - queremos ver errores reales
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

  // Generar URL de onramp usando solo Buy Options (que funciona)
  async generateOnrampURL(walletAddress, amount) {
    try {
      console.log('🌐 Generando URL de onramp para:', walletAddress, amount);
      
      // Resolver ENS si es necesario
      let resolvedAddress = walletAddress;
      try {
        resolvedAddress = await ensService.resolveAndValidateAddress(walletAddress, 'celo');
        console.log('✅ Dirección resuelta y validada para onramp:', resolvedAddress);
      } catch (ensError) {
        console.warn('⚠️ Error resolviendo ENS para onramp, usando dirección original:', ensError.message);
        // Continuar con la dirección original si ENS falla
      }
      
      // Generar URL de onramp directamente usando Buy Options (que funciona)
      const onrampURL = `https://pay.coinbase.com/buy/select-asset?appId=${this.appId}&amount=${amount}&currency=COP&destinationAddress=${resolvedAddress}&purchaseCurrency=CELO&purchaseNetwork=celo`;
      
      console.log('✅ URL de onramp generada usando Buy Options:', onrampURL);
      
      return {
        url: onrampURL,
        method: 'Direct URL Generation',
        walletAddress: resolvedAddress,
        amount: amount,
        currency: 'COP',
        purchaseCurrency: 'CELO',
        network: 'celo'
      };
    } catch (error) {
      console.error('❌ Error generando URL de onramp:', error);
      throw error;
    }
  }

  // Nuevo método: Generar Buy Quote usando backend
  async generateBuyQuote(walletAddress, amount) {
    try {
      console.log('💰 Generando Buy Quote para:', walletAddress, amount);
      
      // Resolver ENS si es necesario
      let resolvedAddress = walletAddress;
      try {
        resolvedAddress = await ensService.resolveAndValidateAddress(walletAddress, 'celo');
        console.log('✅ Dirección resuelta y validada para Buy Quote:', resolvedAddress);
      } catch (ensError) {
        console.warn('⚠️ Error resolviendo ENS para Buy Quote, usando dirección original:', ensError.message);
        // Continuar con la dirección original si ENS falla
      }
      
      const response = await fetch('http://localhost:3002/api/generate-buy-quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          walletAddress: resolvedAddress,
          amount: amount
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error del backend Buy Quote:', response.status, errorText);
        throw new Error(`Backend Buy Quote error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ Buy Quote generado exitosamente:', data);
      
      return data;
    } catch (error) {
      console.error('❌ Error generando Buy Quote:', error);
      throw error;
    }
  }

  // Nuevo método: Obtener Buy Options para Colombia y Celo
  async getBuyOptions(country = 'CO', networks = 'celo') {
    try {
      console.log('🔍 Obteniendo Buy Options para:', { country, networks });
      
      const response = await fetch(`http://localhost:3002/api/buy-options?country=${country}&networks=${networks}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error del backend Buy Options:', response.status, errorText);
        throw new Error(`Backend Buy Options error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ Buy Options obtenidos exitosamente:', data);
      
      return data;
    } catch (error) {
      console.error('❌ Error obteniendo Buy Options:', error);
      throw error;
    }
  }
}

export default new CDPService();
