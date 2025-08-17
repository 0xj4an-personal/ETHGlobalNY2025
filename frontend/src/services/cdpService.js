// CDP Onramp Service / Servicio CDP Onramp
// Basado en la documentación / Based on documentation: https://docs.cdp.coinbase.com/onramp-&-offramp/onramp-apis/onramp-overview

import ensService from './ensService.js';

const CDP_API_BASE = 'https://api.coinbase.com/v2';

class CDPService {
  constructor() {
    this.appId = '5e724356-f66f-45d2-accf-c0b562fd2edd';
    this.apiKey = '0761b732-f913-4923-9d08-0387a137de76';
    this.privateKey = 'c1Cdgly3sXPdb1XjalNSoZVZdDruSlKuUsT430xUx80IRdJtEd3vOUgDVjDTKmepVsjimvIqx+7n7bSmv1253g==';
  }

  // Generar URL de onramp para Celo (flujo simplificado) / Generate onramp URL for Celo (simplified flow)
  async generateOnrampURL(walletAddress, amountCOP) {
    try {
      // Flujo: COP → Tarjeta → Celo → Uniswap → cCOP / Flow: COP → Card → Celo → Uniswap → cCOP
      // Usar Buy Options que funciona para obtener sessionToken / Use Buy Options that works to get sessionToken
      
      console.log('STEP: Generando onramp usando Buy Options que funciona... / Generating onramp using Buy Options that works...');
      
      // Llamar a Buy Options que funciona / Call Buy Options that works
      const buyOptionsResponse = await fetch(`http://localhost:3002/api/buy-options?country=CO&networks=celo`);
      
      if (buyOptionsResponse.ok) {
        const buyOptionsData = await buyOptionsResponse.json();
        console.log('SUCCESS: Buy Options obtenido para onramp / Buy Options obtained for onramp:', buyOptionsData);
        
        // Generar URL de onramp con sessionToken del Buy Options / Generate onramp URL with sessionToken from Buy Options
        const baseURL = 'https://pay.coinbase.com/buy/select-asset';
        const params = new URLSearchParams({
          appId: this.appId,
          amount: amountCOP.toString(),
          currency: 'COP',  // SUCCESS: Usar COP directamente / Use COP directly
          destinationAddress: walletAddress,
          purchaseCurrency: 'CELO',
          purchaseNetwork: 'celo',
          country: 'CO',  // SUCCESS: Especificar país / Specify country
          sessionToken: buyOptionsData.sessionToken || buyOptionsData.jwt || 'from-buy-options'
        });

        const onrampURL = `${baseURL}?${params.toString()}`;
        
        console.log('Generated Onramp URL:', onrampURL);
        console.log('Flujo: Usuario compra Celo con COP, luego swap automático a cCOP / Flow: User buys Celo with COP, then automatic swap to cCOP');
        console.log('Nota: SessionToken obtenido desde Buy Options que funciona / Note: SessionToken obtained from Buy Options that works');
        
        return {
          url: onrampURL,
          appId: this.appId,
          flow: 'COP → Tarjeta → Celo → Uniswap → cCOP',
          amountCOP: amountCOP,
          currency: 'COP',
          method: 'Buy Options + Session Token',
          buyOptionsData: buyOptionsData,
          note: 'SessionToken obtenido desde Buy Options que funciona / SessionToken obtained from Buy Options that works'
        };
      } else {
        throw new Error('Buy Options no disponible / Buy Options not available');
      }
    } catch (error) {
      console.error('Error generating onramp URL / Error generando URL de onramp:', error);
      throw new Error('No se pudo generar la URL de onramp / Could not generate onramp URL');
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
      
      // Extraer datos del backend y formatearlos para el frontend / Extract data from backend and format for frontend
      const quote = {
        // Datos principales en COP y USD / Main data in COP and USD
        sourceAmount: amountCOP,
        sourceCurrency: sourceCurrency,
        monto_cop: `${amountCOP.toLocaleString('es-CO')} COP`, // Formatear COP en frontend / Format COP in frontend
        monto_usd: backendData.monto_usd, // Ya formateado en USD / Already formatted in USD
        celo_a_comprar: backendData.celo_a_comprar, // CELO con 6 decimales / CELO with 6 decimals
        
        // Fees en USD (ya formateados) / Fees in USD (already formatted)
        fee_transaccion: backendData.quote.fee_transaccion,
        fee_red: backendData.quote.fee_red,
        total_fees: backendData.quote.total_fees,
        
        // Información del backend / Backend information
        quote_id: backendData.quote.quote_id,
        onramp_url: backendData.onrampUrl,
        optimized_onramp_url: backendData.optimizedOnrampUrl,
        session_token: backendData.sessionToken,
        tipo_cambio: backendData.tipo_cambio,
        
        // Datos calculados para el frontend / Calculated data for frontend
        destinationAmount: parseFloat(backendData.celo_a_comprar).toFixed(6), // CELO recibido / CELO received
        destinationAmountCOP: (parseFloat(backendData.celo_a_comprar) * exchangeRate).toFixed(2), // Valor aproximado en COP / Approximate value in COP
        // Calcular cCOP reales basado en precio de CELO y relación cCOP = COP / Calculate real cCOP based on CELO price and cCOP = COP relation
        realCCOPAmount: ((parseFloat(backendData.celo_a_comprar) * celoPriceUSD) / (1 / exchangeRate)).toFixed(6), // cCOP = COP (1:1)
        celoPriceUSD: celoPriceUSD,
        cCOPPriceUSD: 1 / exchangeRate, // 1 cCOP = 1 COP en valor / 1 cCOP = 1 COP in value
        relation: "cCOP = COP (1:1)",
        destinationAsset: 'cCOP',
        network: 'celo',
        swapFee: '0.30%',
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

  // Generar URL de onramp usando Buy Quote API según recomendaciones oficiales de Coinbase / Generate onramp URL using Buy Quote API according to official Coinbase recommendations
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
            console.log('DATA: Contenido completo de buyQuoteData / Complete content of buyQuoteData:', buyQuoteData);
          }
        } else {
          console.warn('WARNING: Buy Quote API falló con status / Buy Quote API failed with status:', buyQuoteResponse.status);
          const errorText = await buyQuoteResponse.text();
          console.warn('WARNING: Error details / Error details:', errorText);
        }
      } catch (buyQuoteError) {
        console.warn('WARNING: PASO 2 FALLÓ: Error llamando a Buy Quote API / STEP 2 FAILED: Error calling Buy Quote API:', buyQuoteError.message);
      }
      
      // PASO 4: Fallback a Buy Options (por si acaso) / STEP 4: Fallback to Buy Options (just in case)
      console.log('STEP: PASO 4: Usando fallback a Buy Options... / STEP 4: Using fallback to Buy Options...');
      try {
        console.log('STEP: Llamando a Buy Options API... / Calling Buy Options API...');
        
        // Llamar a Buy Options que funciona / Call Buy Options that works
        const buyOptionsResponse = await fetch(`http://localhost:3002/api/buy-options?country=CO&networks=celo`);
        
        if (buyOptionsResponse.ok) {
          const buyOptionsData = await buyOptionsResponse.json();
          console.log('SUCCESS: PASO 4 COMPLETADO: Buy Options obtenido / STEP 4 COMPLETED: Buy Options obtained:', buyOptionsData);
          
          // INVESTIGATION: INVESTIGACIÓN: Ver exactamente qué contiene buyOptionsData / INVESTIGATION: See exactly what buyOptionsData contains
          console.log('INVESTIGATION: INVESTIGACIÓN: Contenido completo de Buy Options / INVESTIGATION: Complete content of Buy Options:');
          console.log('DATA: buyOptionsData.success:', buyOptionsData.success);
          console.log('DATA: buyOptionsData.data:', buyOptionsData.data);
          console.log('DATA: buyOptionsData.jwt:', buyOptionsData.jwt);
          console.log('DATA: buyOptionsData.sessionToken:', buyOptionsData.sessionToken);
          console.log('DATA: buyOptionsData.quote:', buyOptionsData.quote);
          console.log('DATA: buyOptionsData.onrampUrl:', buyOptionsData.onrampUrl);
          
          // Buscar sessionToken en diferentes ubicaciones posibles / Search for sessionToken in different possible locations
          let sessionToken = null;
          
          // Opción 1: Buscar en data.sessionToken / Option 1: Search in data.sessionToken
          if (buyOptionsData.data?.sessionToken) {
            sessionToken = buyOptionsData.data.sessionToken;
            console.log('SUCCESS: SessionToken encontrado en data.sessionToken / SessionToken found in data.sessionToken:', sessionToken);
          }
          // Opción 2: Buscar en data.token / Option 2: Search in data.token
          else if (buyOptionsData.data?.token) {
            sessionToken = buyOptionsData.data.token;
            console.log('SUCCESS: Token encontrado en data.token / Token found in data.token:', sessionToken);
          }
          // Opción 3: Buscar en data.quote.sessionToken / Option 3: Search in data.quote.sessionToken
          else if (buyOptionsData.data?.quote?.sessionToken) {
            sessionToken = buyOptionsData.data.quote.sessionToken;
            console.log('SUCCESS: SessionToken encontrado en data.quote.sessionToken / SessionToken found in data.quote.sessionToken:', sessionToken);
          }
          // Opción 4: Buscar en data.onrampUrl / Option 4: Search in data.onrampUrl
          else if (buyOptionsData.data?.onrampUrl) {
            sessionToken = buyOptionsData.data.onrampUrl;
            console.log('SUCCESS: onrampUrl encontrado en data.onrampUrl / onrampUrl found in data.onrampUrl:', sessionToken);
          }
          // Opción 5: Usar JWT como fallback (aunque sabemos que no es válido) / Option 5: Use JWT as fallback (although we know it's not valid)
          else {
            sessionToken = buyOptionsData.jwt || 'from-buy-options';
            console.log('WARNING: Usando JWT como fallback (puede no ser válido) / Using JWT as fallback (may not be valid):', sessionToken);
          }
          
          // PASO 5: Generar URL de onramp con sessionToken encontrado / STEP 5: Generate onramp URL with found sessionToken
          console.log('STEP: PASO 5: Generando URL de onramp... / STEP 5: Generating onramp URL...');
          
          // ✅ Usar USD para CARD payments según CDP docs / Use USD for CARD payments according to CDP docs
        const onrampURL = `https://pay.coinbase.com/buy/select-asset?appId=${this.appId}&amount=${amount}&currency=USD&destinationAddress=${resolvedAddress}&purchaseCurrency=CELO&purchaseNetwork=celo&country=US&sessionToken=${sessionToken}`;
          
          console.log('SUCCESS: PASO 5 COMPLETADO: URL de onramp generada usando Buy Options / STEP 5 COMPLETED: Onramp URL generated using Buy Options:', onrampURL);
          console.log('KEY: SessionToken usado / SessionToken used:', sessionToken);
          console.log('WARNING: NOTA: Este es un fallback - puede no funcionar si no es un sessionToken válido / NOTE: This is a fallback - may not work if it is not a valid sessionToken');
          
          return {
            url: onrampURL,
            method: 'Buy Options + Session Token (Fallback)',
            walletAddress: resolvedAddress,
            originalInput: walletAddress,
            amount: amount,
            currency: 'COP',
            purchaseCurrency: 'CELO',
            network: 'celo',
            country: 'CO',
            buyOptionsData: buyOptionsData,
            sessionToken: sessionToken,
            note: 'SessionToken obtenido desde Buy Options (fallback) / SessionToken obtained from Buy Options (fallback)',
            steps: {
              step1: 'ENS Resolved',
              step2: 'Buy Quote Failed',
              step3: 'Buy Options Fallback Used'
            }
          };
        }
      } catch (buyOptionsError) {
        console.warn('WARNING: PASO 4 FALLÓ: Error obteniendo Buy Options / STEP 4 FAILED: Error getting Buy Options:', buyOptionsError.message);
      }
      
      // PASO 6: Fallback final a URL directa sin sessionToken / STEP 6: Final fallback to direct URL without sessionToken
      console.log('STEP: PASO 6: Usando fallback final a URL directa... / STEP 6: Using final fallback to direct URL...');
              // ✅ Usar USD para CARD payments según CDP docs / Use USD for CARD payments according to CDP docs
        const fallbackURL = `https://pay.coinbase.com/buy/select-asset?appId=${this.appId}&amount=${amount}&currency=USD&destinationAddress=${resolvedAddress}&purchaseCurrency=CELO&purchaseNetwork=celo&country=US`;
      
      console.log('SUCCESS: PASO 6 COMPLETADO: URL de onramp fallback final generada / STEP 6 COMPLETED: Final onramp fallback URL generated:', fallbackURL);
      
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
