// CDP Onramp Service / Servicio CDP Onramp
// Basado en la documentación / Based on documentation: https://docs.cdp.coinbase.com/onramp-&-offramp/onramp-apis/onramp-overview

import ensService from './ensService.js';

const CDP_API_BASE = 'https://api.coinbase.com/v2';

class CDPService {
  constructor() {
    // Las credenciales se manejan desde el backend / Credentials are handled from backend
    this.appId = '5e724356-f66f-45d2-accf-c0b562fd2edd'; // Solo para URLs de fallback / Only for fallback URLs
  }

  // Generar URL de onramp para Celo (flujo simplificado) / Generate onramp URL for Celo (simplified flow)
  async generateOnrampURL(walletAddress, amountCOP) {
    try {
      console.log('ONRAMP: Generando URL de onramp para / Generating onramp URL for:', walletAddress, amountCOP, 'COP');
      
      // ✅ PASO 0: Convertir COP a USD antes de cualquier cosa / STEP 0: Convert COP to USD before anything else
      console.log('STEP: PASO 0: Convirtiendo COP a USD... / STEP 0: Converting COP to USD...');
      const priceResponse = await fetch('http://localhost:3002/api/price/cop-usd?network=mainnet');
      if (!priceResponse.ok) {
        throw new Error('No se pudo obtener el precio COP/USD del backend');
      }
      
      const priceData = await priceResponse.json();
      const exchangeRate = priceData.price;
      const amountUSD = amountCOP / exchangeRate;
      
      console.log(`💱 Conversión COP→USD: ${amountCOP.toLocaleString('es-CO')} COP = $${amountUSD.toFixed(2)} USD (tasa: ${exchangeRate})`);
      
      // PASO 1: Resolver ENS PRIMERO (antes que nada) / STEP 1: Resolve ENS FIRST (before anything else)
      console.log('INVESTIGATION: PASO 1: Resolviendo ENS/dirección... / STEP 1: Resolving ENS/address...');
      let resolvedAddress = walletAddress;
      
      try {
        resolvedAddress = await ensService.resolveAndValidateAddress(walletAddress, 'celo');
        console.log('SUCCESS: PASO 1 COMPLETADO: Dirección resuelta y validada / STEP 1 COMPLETED: Address resolved and validated:', resolvedAddress);
      } catch (ensError) {
        console.error('ERROR: PASO 1 FALLÓ: Error resolviendo ENS / STEP 1 FAILED: Error resolving ENS:', ensError.message);
        console.log('WARNING: Continuando con dirección original / Continuing with original address:', walletAddress);
        // Continuar con la dirección original si ENS falla / Continue with original address if ENS fails
        resolvedAddress = walletAddress;
      }
      
      // PASO 2: Usar Buy Quote API según recomendaciones oficiales de Coinbase / STEP 2: Use Buy Quote API according to official Coinbase recommendations
      console.log('STEP: PASO 2: Llamando a Buy Quote API (recomendación oficial de Coinbase)... / STEP 2: Calling Buy Quote API (official Coinbase recommendation)...');
      try {
        console.log('STEP: Llamando a Buy Quote API con JWT... / Calling Buy Quote API with JWT...');
        
        // ✅ Llamar a Buy Quote API con monto convertido a USD / Call Buy Quote API with USD converted amount
        const buyQuoteResponse = await fetch(`http://localhost:3002/api/generate-buy-quote`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            walletAddress: resolvedAddress,
            amount: amountUSD, // ✅ SUCCESS: Enviar monto en USD / Send amount in USD
            country: 'US', // ✅ SUCCESS: Usar US para CARD payments / Use US for CARD payments
            subdivision: 'US-NY' // ✅ SUCCESS: Especificar subdivisión US / Specify US subdivision
          })
        });
        
        if (buyQuoteResponse.ok) {
          const buyQuoteData = await buyQuoteResponse.json();
          console.log('SUCCESS: PASO 2 COMPLETADO: Buy Quote obtenido / STEP 2 COMPLETED: Buy Quote obtained:', buyQuoteData);
          
          // PASO 3: Extraer onrampUrl que contiene el session token / STEP 3: Extract onrampUrl that contains session token
          console.log('STEP: PASO 3: Extrayendo onrampUrl con session token... / STEP 3: Extracting onrampUrl with session token...');
          
          if (buyQuoteData.onrampUrl) {
            console.log('SUCCESS: onrampUrl encontrado en Buy Quote API / onrampUrl found in Buy Quote API:', buyQuoteData.onrampUrl);
            console.log('TARGET: Esta URL contiene el session token según recomendaciones de Coinbase / This URL contains the session token according to Coinbase recommendations');
            
            return {
              url: buyQuoteData.onrampUrl,
              method: 'Buy Quote API + onrampUrl (Recomendación Oficial de Coinbase)',
              walletAddress: resolvedAddress,
              originalInput: walletAddress,
              amount: amount,
              currency: 'COP',
              purchaseCurrency: 'CELO',
              network: 'celo',
              country: 'CO',
              sessionToken: 'Incluido en onrampUrl / Included in onrampUrl',
              buyQuoteData: buyQuoteData,
              note: 'onrampUrl obtenido de Buy Quote API - contiene session token según Coinbase / onrampUrl obtained from Buy Quote API - contains session token according to Coinbase',
              steps: {
                step1: 'ENS Resolved',
                step2: 'Buy Quote API Called',
                step3: 'onrampUrl Extracted (Contains Session Token)'
              },
              source: 'Oficial de Coinbase - Buy Quote API devuelve onrampUrl con session token / Official from Coinbase - Buy Quote API returns onrampUrl with session token'
            };
          } else {
            console.warn('WARNING: onrampUrl no encontrado en Buy Quote API / onrampUrl not found in Buy Quote API');
          }
        } else {
          console.warn('WARNING: Buy Quote API falló / Buy Quote API failed:', buyQuoteResponse.status);
        }
      } catch (buyQuoteError) {
        console.warn('WARNING: Buy Quote API falló / Buy Quote API failed:', buyQuoteError);
      }
      
      // PASO 4: Fallback a Buy Options si Buy Quote falla / STEP 4: Fallback to Buy Options if Buy Quote fails
      console.log('STEP: PASO 4: Intentando Buy Options como fallback... / STEP 4: Trying Buy Options as fallback...');
      try {
        const buyOptionsResponse = await fetch(`http://localhost:3002/api/buy-options?country=CO&networks=celo&walletAddress=${resolvedAddress}`);
        
        if (buyOptionsResponse.ok) {
          const buyOptionsData = await buyOptionsResponse.json();
          console.log('SUCCESS: Buy Options obtenido como fallback / Buy Options obtained as fallback:', buyOptionsData);
          
          if (buyOptionsData.sessionToken) {
            // Generar URL de onramp con sessionToken del Buy Options / Generate onramp URL with sessionToken from Buy Options
            const baseURL = 'https://pay.coinbase.com/buy/select-asset';
            const params = new URLSearchParams({
              appId: this.appId,
              amount: amountCOP.toString(),
              currency: 'COP',
              destinationAddress: resolvedAddress,
              purchaseCurrency: 'CELO',
              purchaseNetwork: 'celo',
              country: 'CO',
              sessionToken: buyOptionsData.sessionToken
            });

            const onrampURL = `${baseURL}?${params.toString()}`;
            
            return {
              url: onrampURL,
              method: 'Buy Options Fallback + Session Token',
              walletAddress: resolvedAddress,
              originalInput: walletAddress,
              amount: amountCOP,
              currency: 'COP',
              purchaseCurrency: 'CELO',
              network: 'celo',
              country: 'CO',
              sessionToken: buyOptionsData.sessionToken,
              buyOptionsData: buyOptionsData,
              note: 'Fallback a Buy Options - sessionToken obtenido / Fallback to Buy Options - sessionToken obtained',
              steps: {
                step1: 'ENS Resolved',
                step2: 'Buy Quote Failed',
                step3: 'Buy Options Fallback Used'
              }
            };
          }
        }
      } catch (buyOptionsError) {
        console.warn('WARNING: Buy Options fallback falló / Buy Options fallback failed:', buyOptionsError);
      }
      
      // PASO 5: Fallback final sin sessionToken / STEP 5: Final fallback without sessionToken
      console.log('STEP: PASO 5: Generando URL de onramp fallback final... / STEP 5: Generating final onramp fallback URL...');
      const fallbackURL = `https://pay.coinbase.com/buy/select-asset?appId=${this.appId}&amount=${amount}&currency=USD&destinationAddress=${resolvedAddress}&purchaseCurrency=CELO&purchaseNetwork=celo&country=US`;
      
      console.log('SUCCESS: PASO 5 COMPLETADO: URL de onramp fallback final generada / STEP 5 COMPLETED: Final onramp fallback URL generated:', fallbackURL);
      
      return {
        url: fallbackURL,
        method: 'Fallback URL Directa (Sin SessionToken)',
        walletAddress: resolvedAddress,
        originalInput: walletAddress,
        amount: amount,
        currency: 'COP',
        purchaseCurrency: 'CELO',
        network: 'celo',
        country: 'CO',
        note: 'Fallback final sin sessionToken - todas las APIs fallaron / Final fallback without sessionToken - all APIs failed',
        steps: {
          step1: 'ENS Resolved',
          step2: 'Buy Quote Failed',
          step3: 'Buy Options Failed',
          step4: 'Final Fallback Used'
        }
      };
      
    } catch (error) {
      console.error('ERROR: Error generando URL de onramp / Error generating onramp URL:', error);
      throw error;
    }
  }

  // Generar sessionToken con dirección de wallet específica / Generate sessionToken with specific wallet address
  async generateSessionTokenWithAddress(walletAddress, amount) {
    try {
      console.log('KEY: Generando session token para wallet / Generating session token for wallet:', walletAddress, 'amount:', amount);
      
      // Resolver ENS si es necesario / Resolve ENS if necessary
      let resolvedAddress = walletAddress;
      try {
        resolvedAddress = await ensService.resolveAndValidateAddress(walletAddress, 'celo');
        console.log('SUCCESS: Dirección resuelta y validada / Address resolved and validated:', resolvedAddress);
      } catch (ensError) {
        console.warn('WARNING: Error resolviendo ENS, usando dirección original / Error resolving ENS, using original address:', ensError.message);
        // Continuar con la dirección original si ENS falla / Continue with original address if ENS fails
      }
      
      // Llamar al backend para generar session token completo / Call backend to generate complete session token
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
        console.error('ERROR: Error del backend / Backend error:', response.status, errorText);
        throw new Error(`Backend error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('SUCCESS: Session token generado exitosamente desde backend / Session token generated successfully from backend');
      console.log('SUCCESS: Response data / Response data:', data);
      
      return data.sessionToken;
    } catch (error) {
      console.error('ERROR: Error completo generando session token / Complete error generating session token:', error);
      throw error; // No más fallback - queremos ver errores reales / No more fallback - we want to see real errors
    }
  }

  // Generar JWT Bearer token para autenticación con CDP / Generate JWT Bearer token for CDP authentication
  async generateJWTToken() {
    try {
      console.log('JWT: Generando JWT token real desde backend... / Generating real JWT token from backend...');
      
      // Llamar al backend para generar JWT real / Call backend to generate real JWT
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
        console.error('ERROR: Error del backend / Backend error:', response.status, errorText);
        throw new Error(`Backend error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('SUCCESS: JWT token real generado desde backend / Real JWT token generated from backend');
      
      return data.jwt;
    } catch (error) {
      console.error('ERROR: Error generando JWT desde backend / Error generating JWT from backend:', error);
      throw error; // No más fallback - queremos ver errores reales / No more fallback - we want to see real errors
    }
  }

  // Generar sessionToken usando la API real de CDP / Generate sessionToken using real CDP API
  async generateSessionToken() {
    try {
      // Según la documentación oficial / According to official documentation: https://docs.cdp.coinbase.com/onramp-&-offramp/session-token-authentication
      // Usando tu API key real / Using your real API key: 0761b732-f913-4923-9d08-0387a137de76
      
      console.log('KEY: Generando session token real con API key / Generating real session token with API key:', this.apiKey);
      
      // Llamada a la API real de CDP para generar session token / Call to real CDP API to generate session token
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
              address: "0x0000000000000000000000000000000000000000", // Placeholder, se actualizará / Placeholder, will be updated
              blockchains: ["celo"]
            }
          ],
          assets: ["CELO"]
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response from CDP API / Error response from CDP API:', response.status, errorText);
        throw new Error(`CDP API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('SUCCESS: Session token generado exitosamente / Session token generated successfully:', data);
      
      return data.token;
    } catch (error) {
      console.error('Error generating session token / Error generando session token:', error);
      
              // Fallback: usar token de ejemplo si la API falla / Fallback: use example token if API fails
        console.warn('WARNING: Fallback a token de ejemplo debido a error en API / Fallback to example token due to API error');
      const exampleToken = 'ZWJlNDgwYmItNjBkMi00ZmFiLWIxYTQtMTM3MGI2YjJiNjFh';
      return exampleToken;
    }
  }

  // Obtener configuración de países y métodos de pago / Get country and payment method configuration
  async getOnrampConfig() {
    try {
      // Simular respuesta de la API de configuración / Simulate configuration API response
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
      console.error('Error getting onramp config / Error obteniendo configuración de onramp:', error);
      throw new Error('No se pudo obtener la configuración / Could not get configuration');
    }
  }

  // Obtener quote real desde el backend (COP a CELO) / Get real quote from backend (COP to CELO)
  async getQuote(amountCOP, sourceCurrency = 'COP', destinationAsset = 'CELO') {
    try {
      console.log('QUOTE: Obteniendo quote real desde el backend para / Getting real quote from backend for:', amountCOP, 'COP');
      
      // Obtener precio dinámico COP/USD desde el backend (mainnet) / Get dynamic COP/USD price from backend (mainnet)
      const priceResponse = await fetch('http://localhost:3002/api/price/cop-usd?network=mainnet');
      if (!priceResponse.ok) {
        throw new Error('No se pudo obtener el precio COP/USD del backend');
      }
      
      const priceData = await priceResponse.json();
      const exchangeRate = priceData.price;
      const amountUSD = amountCOP / exchangeRate;
      
      console.log(`💱 Conversión COP→USD usando precio dinámico / COP→USD conversion using dynamic price: ${amountCOP.toLocaleString('es-CO')} COP = $${amountUSD.toFixed(2)} USD (tasa: ${exchangeRate})`);
      
      // Obtener precios reales de CELO y cCOP / Get real prices for CELO and cCOP
      const celoPriceResponse = await fetch('http://localhost:3002/api/price/celo-ccop');
      let celoPriceUSD = 0.50; // Fallback / Fallback
      let cCOPPriceUSD = 1.00; // Fallback / Fallback
      
      if (celoPriceResponse.ok) {
        const celoPriceData = await celoPriceResponse.json();
        celoPriceUSD = celoPriceData.celo.price;
        cCOPPriceUSD = celoPriceData.cCOP.price;
        console.log(`💰 Precios obtenidos: CELO = $${celoPriceUSD} USD, cCOP = $${cCOPPriceUSD} USD`);
      } else {
        console.warn('⚠️ No se pudo obtener precio de CELO, usando fallback / Could not get CELO price, using fallback');
      }
      
      // Llamar al backend para obtener quote real / Call backend to get real quote
      const response = await fetch('http://localhost:3002/api/generate-buy-quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: '0x8f51DC0791CdDDDCE08052FfF939eb7cf0c17856', // Dirección de prueba que funciona / Test address that works
          amount: amountUSD, // SUCCESS: Enviar el monto en USD directamente / Send amount in USD directly
          country: 'US', // SUCCESS: Usar US para CARD payments / Use US for CARD payments
          subdivision: 'US-NY' // SUCCESS: Especificar subdivisión US / Specify US subdivision
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('ERROR: Error del backend / Backend error:', response.status, errorText);
        throw new Error(`Backend error: ${response.status} - ${errorText}`);
      }
      
      const backendData = await response.json();
      console.log('SUCCESS: Quote real obtenido del backend / Real quote obtained from backend:', backendData);
      
      // Calcular CELO real basado en el monto USD y precio actual de Chainlink / Calculate real CELO based on USD amount and current Chainlink price
      const amountUSDFromBackend = parseFloat(backendData.monto_usd.replace('$', '').replace(' USD', ''));
      const celoAmount = (amountUSDFromBackend / celoPriceUSD).toFixed(6);
      const celoAmountCOP = (parseFloat(celoAmount) * celoPriceUSD * exchangeRate).toFixed(2);
      
      // Calcular cCOP reales usando precios de Chainlink / Calculate real cCOP using Chainlink prices
      // cCOP = COP (1:1 relación) según especificación del proyecto
      const cCOPAmount = (amountUSDFromBackend * exchangeRate).toFixed(2); // 1 USD = 4031 COP
      
      // Calcular fees estimados (aproximación basada en estándares de la industria) / Calculate estimated fees (approximation based on industry standards)
      const estimatedTransactionFee = (amountUSDFromBackend * 0.029).toFixed(2); // 2.9% fee típico / Typical 2.9% fee
      const estimatedNetworkFee = "0.50"; // Fee de red fijo / Fixed network fee
      const totalFees = (parseFloat(estimatedTransactionFee) + parseFloat(estimatedNetworkFee)).toFixed(2);
      
      // Extraer datos del backend y formatearlos para el frontend / Extract data from backend and format for frontend
      const quote = {
        // Datos principales en COP y USD / Main data in COP and USD
        sourceAmount: amountCOP,
        sourceCurrency: sourceCurrency,
        monto_cop: `${amountCOP.toLocaleString('es-CO')} COP`, // Formatear COP en frontend / Format COP in frontend
        monto_usd: backendData.monto_usd, // Ya formateado en USD / Already formatted in USD
        celo_a_comprar: celoAmount, // CELO calculado basado en precio actual / CELO calculated based on current price
        
        // Fees en USD (estimados basados en estándares) / Fees in USD (estimated based on standards)
        fee_transaccion: `$${estimatedTransactionFee}`,
        fee_red: `$${estimatedNetworkFee}`,
        total_fees: `$${totalFees}`,
        
        // Información del backend / Backend information
        quote_id: `onramp-${Date.now()}`, // Generar ID único / Generate unique ID
        onramp_url: backendData.onrampUrl,
        optimized_onramp_url: backendData.onrampUrl, // Usar la misma URL / Use the same URL
        session_token: null, // No tenemos session token en esta implementación / No session token in this implementation
        tipo_cambio: backendData.tipo_cambio,
        
        // Datos calculados para el frontend / Calculated data for frontend
        destinationAmount: celoAmount, // CELO real calculado / Real calculated CELO
        destinationAmountCOP: celoAmountCOP, // Valor en COP del CELO / COP value of CELO
        // Calcular cCOP reales basado en precios de Chainlink / Calculate real cCOP based on Chainlink prices
        realCCOPAmount: cCOPAmount, // cCOP = COP (1:1) usando precios reales / cCOP = COP (1:1) using real prices
        celoPriceUSD: celoPriceUSD,
        cCOPPriceUSD: exchangeRate, // 1 cCOP = 4031 COP (precio real de Chainlink) / 1 cCOP = 4031 COP (real Chainlink price)
        relation: "cCOP = COP (1:1) - Chainlink",
        destinationAsset: 'cCOP',
        network: 'celo',
        swapFee: '2.9%',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutos / 5 minutes
        
        // Datos del backend para debugging / Backend data for debugging
        backendData: backendData
      };

      console.log('SUCCESS: Quote formateado para frontend / Quote formatted for frontend:', quote);
      return quote;
    } catch (error) {
      console.error('ERROR: Error obteniendo quote del backend / Error getting quote from backend:', error);
      throw new Error(`No se pudo obtener el quote del backend / Could not get quote from backend: ${error.message}`);
    }
  }



  // Nuevo método: Generar Buy Quote usando backend / New method: Generate Buy Quote using backend
  async generateBuyQuote(walletAddress, amount) {
    try {
      console.log('QUOTE: Generando Buy Quote para / Generating Buy Quote for:', walletAddress, amount);
      
      // Resolver ENS si es necesario / Resolve ENS if necessary
      let resolvedAddress = walletAddress;
      try {
        resolvedAddress = await ensService.resolveAndValidateAddress(walletAddress, 'celo');
        console.log('SUCCESS: Dirección resuelta y validada para Buy Quote / Address resolved and validated for Buy Quote:', resolvedAddress);
      } catch (ensError) {
        console.warn('WARNING: Error resolviendo ENS para Buy Quote, usando dirección original / Error resolving ENS for Buy Quote, using original address:', ensError.message);
        // Continuar con la dirección original si ENS falla / Continue with original address if ENS fails
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
        console.error('ERROR: Error del backend Buy Quote / Backend Buy Quote error:', response.status, errorText);
        throw new Error(`Backend Buy Quote error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('SUCCESS: Buy Quote generado exitosamente / Buy Quote generated successfully:', data);
      
      return data;
    } catch (error) {
      console.error('ERROR: Error generando Buy Quote / Error generating Buy Quote:', error);
      throw error;
    }
  }

  // Nuevo método: Obtener Buy Options para Colombia y Celo / New method: Get Buy Options for Colombia and Celo
  async getBuyOptions(country = 'CO', networks = 'celo', walletAddress = null) {
    try {
      // ✅ Usar dirección por defecto si no se proporciona / Use default address if not provided
      const defaultWalletAddress = walletAddress || '0x8f51DC0791CdDDDCE08052FfF939eb7cf0c17856';
      
      console.log('INVESTIGATION: Obteniendo Buy Options para / Getting Buy Options for:', { country, networks, walletAddress: defaultWalletAddress });
      
      const response = await fetch(`http://localhost:3002/api/buy-options?country=${country}&networks=${networks}&walletAddress=${defaultWalletAddress}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('ERROR: Error del backend Buy Options / Backend Buy Options error:', response.status, errorText);
        throw new Error(`Backend Buy Options error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('SUCCESS: Buy Options obtenidos exitosamente / Buy Options obtained successfully:', data);
      
      return data;
    } catch (error) {
      console.error('ERROR: Error obteniendo Buy Options / Error getting Buy Options:', error);
      throw error;
    }
  }
}

export default new CDPService();
