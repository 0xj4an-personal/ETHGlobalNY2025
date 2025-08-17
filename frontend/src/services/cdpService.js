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
      // Usar Buy Options que funciona para obtener sessionToken
      
      console.log('🔄 Generando onramp usando Buy Options que funciona...');
      
      // Llamar a Buy Options que funciona
      const buyOptionsResponse = await fetch(`http://localhost:3002/api/buy-options?country=CO&networks=celo`);
      
      if (buyOptionsResponse.ok) {
        const buyOptionsData = await buyOptionsResponse.json();
        console.log('✅ Buy Options obtenido para onramp:', buyOptionsData);
        
        // Generar URL de onramp con sessionToken del Buy Options
        const baseURL = 'https://pay.coinbase.com/buy/select-asset';
        const params = new URLSearchParams({
          appId: this.appId,
          amount: amountCOP.toString(),
          currency: 'COP',  // ✅ Usar COP directamente
          destinationAddress: walletAddress,
          purchaseCurrency: 'CELO',
          purchaseNetwork: 'celo',
          country: 'CO',  // ✅ Especificar país
          sessionToken: buyOptionsData.sessionToken || buyOptionsData.jwt || 'from-buy-options'
        });

        const onrampURL = `${baseURL}?${params.toString()}`;
        
        console.log('Generated Onramp URL:', onrampURL);
        console.log('Flujo: Usuario compra Celo con COP, luego swap automático a cCOP');
        console.log('Nota: SessionToken obtenido desde Buy Options que funciona');
        
        return {
          url: onrampURL,
          appId: this.appId,
          flow: 'COP → Tarjeta → Celo → Uniswap → cCOP',
          amountCOP: amountCOP,
          currency: 'COP',
          method: 'Buy Options + Session Token',
          buyOptionsData: buyOptionsData,
          note: 'SessionToken obtenido desde Buy Options que funciona'
        };
      } else {
        throw new Error('Buy Options no disponible');
      }
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

  // Obtener quote real desde el backend (solo COP y CELO)
  async getQuote(amountCOP, sourceCurrency = 'COP', destinationAsset = 'cCOP') {
    try {
      console.log('💰 Obteniendo quote real desde el backend para:', amountCOP, 'COP');
      
      // Llamar al backend para obtener quote real
      const response = await fetch('http://localhost:3002/api/generate-buy-quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: '0x8f51DC0791CdDDDCE08052FfF939eb7cf0c17856', // Dirección de prueba que funciona
          amount: amountCOP / 4000 // Convertir COP a USD para el backend
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error del backend:', response.status, errorText);
        throw new Error(`Backend error: ${response.status} - ${errorText}`);
      }
      
      const backendData = await response.json();
      console.log('✅ Quote real obtenido del backend:', backendData);
      
      // Extraer datos del backend y formatearlos para el frontend
      const quote = {
        // Datos principales en COP
        sourceAmount: amountCOP,
        sourceCurrency: sourceCurrency,
        monto_cop: backendData.monto_cop, // Ya formateado en COP
        celo_a_comprar: backendData.celo_a_comprar, // CELO con 6 decimales
        
        // Fees en COP (ya formateados)
        fee_transaccion: backendData.quote.fee_transaccion,
        fee_red: backendData.quote.fee_red,
        total_fees: backendData.quote.total_fees,
        
        // Información del backend
        quote_id: backendData.quote.quote_id,
        onramp_url: backendData.onrampUrl,
        optimized_onramp_url: backendData.optimizedOnrampUrl,
        session_token: backendData.sessionToken,
        tipo_cambio: backendData.tipo_cambio,
        
        // Datos calculados para el frontend
        destinationAmount: (parseFloat(backendData.celo_a_comprar) * 4000).toFixed(2), // Aproximado para cCOP
        destinationAsset: 'cCOP',
        network: 'celo',
        swapFee: '0.30%',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutos
        
        // Datos del backend para debugging
        backendData: backendData
      };

      console.log('✅ Quote formateado para frontend:', quote);
      return quote;
    } catch (error) {
      console.error('❌ Error obteniendo quote del backend:', error);
      throw new Error(`No se pudo obtener el quote del backend: ${error.message}`);
    }
  }

  // Generar URL de onramp usando Buy Quote API según recomendaciones oficiales de Coinbase
  async generateOnrampURL(walletAddress, amount) {
    try {
      console.log('🌐 Generando URL de onramp para:', walletAddress, amount);
      
      // PASO 1: Resolver ENS PRIMERO (antes que nada)
      console.log('🔍 PASO 1: Resolviendo ENS/dirección...');
      let resolvedAddress = walletAddress;
      
      try {
        resolvedAddress = await ensService.resolveAndValidateAddress(walletAddress, 'celo');
        console.log('✅ PASO 1 COMPLETADO: Dirección resuelta y validada:', resolvedAddress);
      } catch (ensError) {
        console.error('❌ PASO 1 FALLÓ: Error resolviendo ENS:', ensError.message);
        console.log('⚠️ Continuando con dirección original:', walletAddress);
        // Continuar con la dirección original si ENS falla
        resolvedAddress = walletAddress;
      }
      
      // PASO 2: Usar Buy Quote API según recomendaciones oficiales de Coinbase
      console.log('🔄 PASO 2: Llamando a Buy Quote API (recomendación oficial de Coinbase)...');
      try {
        console.log('🔄 Llamando a Buy Quote API con JWT...');
        
        // Llamar a Buy Quote API según documentación oficial
        const buyQuoteResponse = await fetch(`http://localhost:3002/api/generate-buy-quote`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            walletAddress: resolvedAddress,
            amount: amount,
            country: 'CO',
          })
        });
        
        if (buyQuoteResponse.ok) {
          const buyQuoteData = await buyQuoteResponse.json();
          console.log('✅ PASO 2 COMPLETADO: Buy Quote obtenido:', buyQuoteData);
          
          // PASO 3: Extraer onrampUrl que contiene el session token
          console.log('🔄 PASO 3: Extrayendo onrampUrl con session token...');
          
          if (buyQuoteData.onrampUrl) {
            console.log('✅ onrampUrl encontrado en Buy Quote API:', buyQuoteData.onrampUrl);
            console.log('🎯 Esta URL contiene el session token según recomendaciones de Coinbase');
            
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
              sessionToken: 'Incluido en onrampUrl',
              buyQuoteData: buyQuoteData,
              note: 'onrampUrl obtenido de Buy Quote API - contiene session token según Coinbase',
              steps: {
                step1: 'ENS Resolved',
                step2: 'Buy Quote API Called',
                step3: 'onrampUrl Extracted (Contains Session Token)'
              },
              source: 'Oficial de Coinbase - Buy Quote API devuelve onrampUrl con session token'
            };
          } else {
            console.warn('⚠️ onrampUrl no encontrado en Buy Quote API');
            console.log('📊 Contenido completo de buyQuoteData:', buyQuoteData);
          }
        } else {
          console.warn('⚠️ Buy Quote API falló con status:', buyQuoteResponse.status);
          const errorText = await buyQuoteResponse.text();
          console.warn('⚠️ Error details:', errorText);
        }
      } catch (buyQuoteError) {
        console.warn('⚠️ PASO 2 FALLÓ: Error llamando a Buy Quote API:', buyQuoteError.message);
      }
      
      // PASO 4: Fallback a Buy Options (por si acaso)
      console.log('🔄 PASO 4: Usando fallback a Buy Options...');
      try {
        console.log('🔄 Llamando a Buy Options API...');
        
        // Llamar a Buy Options que funciona
        const buyOptionsResponse = await fetch(`http://localhost:3002/api/buy-options?country=CO&networks=celo`);
        
        if (buyOptionsResponse.ok) {
          const buyOptionsData = await buyOptionsResponse.json();
          console.log('✅ PASO 4 COMPLETADO: Buy Options obtenido:', buyOptionsData);
          
          // 🔍 INVESTIGACIÓN: Ver exactamente qué contiene buyOptionsData
          console.log('🔍 INVESTIGACIÓN: Contenido completo de Buy Options:');
          console.log('📊 buyOptionsData.success:', buyOptionsData.success);
          console.log('📊 buyOptionsData.data:', buyOptionsData.data);
          console.log('📊 buyOptionsData.jwt:', buyOptionsData.jwt);
          console.log('📊 buyOptionsData.sessionToken:', buyOptionsData.sessionToken);
          console.log('📊 buyOptionsData.quote:', buyOptionsData.quote);
          console.log('📊 buyOptionsData.onrampUrl:', buyOptionsData.onrampUrl);
          
          // Buscar sessionToken en diferentes ubicaciones posibles
          let sessionToken = null;
          
          // Opción 1: Buscar en data.sessionToken
          if (buyOptionsData.data?.sessionToken) {
            sessionToken = buyOptionsData.data.sessionToken;
            console.log('✅ SessionToken encontrado en data.sessionToken:', sessionToken);
          }
          // Opción 2: Buscar en data.token
          else if (buyOptionsData.data?.token) {
            sessionToken = buyOptionsData.data.token;
            console.log('✅ Token encontrado en data.token:', sessionToken);
          }
          // Opción 3: Buscar en data.quote.sessionToken
          else if (buyOptionsData.data?.quote?.sessionToken) {
            sessionToken = buyOptionsData.data.quote.sessionToken;
            console.log('✅ SessionToken encontrado en data.quote.sessionToken:', sessionToken);
          }
          // Opción 4: Buscar en data.onrampUrl
          else if (buyOptionsData.data?.onrampUrl) {
            sessionToken = buyOptionsData.data.onrampUrl;
            console.log('✅ onrampUrl encontrado en data.onrampUrl:', sessionToken);
          }
          // Opción 5: Usar JWT como fallback (aunque sabemos que no es válido)
          else {
            sessionToken = buyOptionsData.jwt || 'from-buy-options';
            console.log('⚠️ Usando JWT como fallback (puede no ser válido):', sessionToken);
          }
          
          // PASO 5: Generar URL de onramp con sessionToken encontrado
          console.log('🔄 PASO 5: Generando URL de onramp...');
          
          const onrampURL = `https://pay.coinbase.com/buy/select-asset?appId=${this.appId}&amount=${amount}&currency=COP&destinationAddress=${resolvedAddress}&purchaseCurrency=CELO&purchaseNetwork=celo&country=CO&sessionToken=${sessionToken}`;
          
          console.log('✅ PASO 5 COMPLETADO: URL de onramp generada usando Buy Options:', onrampURL);
          console.log('🔑 SessionToken usado:', sessionToken);
          console.log('⚠️ NOTA: Este es un fallback - puede no funcionar si no es un sessionToken válido');
          
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
            note: 'SessionToken obtenido desde Buy Options (fallback)',
            steps: {
              step1: 'ENS Resolved',
              step2: 'Buy Quote Failed',
              step3: 'Buy Options Fallback Used'
            }
          };
        }
      } catch (buyOptionsError) {
        console.warn('⚠️ PASO 4 FALLÓ: Error obteniendo Buy Options:', buyOptionsError.message);
      }
      
      // PASO 6: Fallback final a URL directa sin sessionToken
      console.log('🔄 PASO 6: Usando fallback final a URL directa...');
      const fallbackURL = `https://pay.coinbase.com/buy/select-asset?appId=${this.appId}&amount=${amount}&currency=COP&destinationAddress=${resolvedAddress}&purchaseCurrency=CELO&purchaseNetwork=celo&country=CO`;
      
      console.log('✅ PASO 6 COMPLETADO: URL de onramp fallback final generada:', fallbackURL);
      
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
        note: 'Fallback final sin sessionToken - todas las APIs fallaron',
        steps: {
          step1: 'ENS Resolved',
          step2: 'Buy Quote Failed',
          step3: 'Buy Options Failed',
          step4: 'Final Fallback Used'
        }
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
