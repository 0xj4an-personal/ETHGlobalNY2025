const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const config = require('./config');

const app = express();
const PORT = config.port;

const { generateJwt } = require("@coinbase/cdp-sdk/auth");

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// CDP Configuration
const CDP_CONFIG = {
  appId: config.cdp.appId,
  apiKey: config.cdp.apiKey,
  privateKey: config.cdp.privateKey
};

// Función para generar JWT para CDP
async function generateCDPJWT(requestMethod = "GET", requestPath = "/onramp/v1/buy/options") {
  try {
    // Generate the JWT using the CDP SDK
    const jwtToken = await generateJwt({
      apiKeyId: CDP_CONFIG.apiKey,
      apiKeySecret: CDP_CONFIG.privateKey,
      requestMethod: requestMethod,
      requestHost: "api.developer.coinbase.com",
      requestPath: requestPath,
      expiresIn: 120 // optional (defaults to 120 seconds)
    });

    console.log('✅ JWT generado exitosamente manualmente');
    console.log('🔑 Token (primeros 50 chars):', jwtToken.substring(0, 50) + '...');
    
    return jwtToken;
  } catch (error) {
    console.error('❌ Error generando JWT manualmente:', error);
    throw new Error(`Error generando JWT manualmente: ${error.message}`);
  }
}

// Ruta para generar JWT
app.post('/api/generate-jwt', async (req, res) => {
  try {
    const { walletAddress } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ 
        error: 'walletAddress es requerido' 
      });
    }

    console.log('🚀 Solicitud de JWT para wallet:', walletAddress);
    
    const jwtToken = await generateCDPJWT();
    
    res.json({
      success: true,
      jwt: jwtToken,
      expiresIn: '1 hour',
      walletAddress: walletAddress
    });
    
  } catch (error) {
    console.error('❌ Error en /api/generate-jwt:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// Ruta para generar session token usando JWT
app.post('/api/generate-session-token', async (req, res) => {
  try {
    const { walletAddress, amount } = req.body;
    
    if (!walletAddress || !amount) {
      return res.status(400).json({ 
        error: 'walletAddress y amount son requeridos' 
      });
    }

    console.log('🚀 Generando session token para:', { walletAddress, amount });
    
    // Primero generar JWT con POST y /onramp/v1/token
    const jwtToken = await generateCDPJWT("POST", "/onramp/v1/token");
    
    // Preparar payload para CDP API (usando solo addresses según nueva API)
    const payload = {
      addresses: [
        {
          address: walletAddress,
          blockchains: ["celo"]
        }
      ],
      assets: ["CGLD"]
    };

    console.log('📤 Llamando a CDP API con payload:', payload);
    
    // Llamar a CDP API para generar session token
    const response = await fetch('https://api.developer.coinbase.com/onramp/v1/token', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error de CDP API:', response.status, errorText);
      
      return res.status(response.status).json({
        error: 'Error de CDP API',
        status: response.status,
        details: errorText
      });
    }

    const data = await response.json();
    console.log('✅ Session token generado exitosamente');
    
    res.json({
      success: true,
      sessionToken: data.token,
      jwt: jwtToken,
      walletAddress: walletAddress,
      amount: amount
    });
    
  } catch (error) {
    console.error('❌ Error en /api/generate-session-token:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// Nueva ruta para generar JWT según CDP docs oficiales
app.post('/api/generate-jwt-cdp', async (req, res) => {
  try {
    const { walletAddress } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({
        error: 'walletAddress es requerido'
      });
    }

    console.log('🚀 Generando JWT según CDP docs oficiales para wallet:', walletAddress);
    
    // Configuración según CDP docs
    const key_name = CDP_CONFIG.apiKey;
    const key_secret = CDP_CONFIG.privateKey;
    const request_method = "POST";
    const request_host = "api.developer.coinbase.com";
    const request_path = "/onramp/v1/token";
    
    const algorithm = "ES256";
    const uri = `${request_method} ${request_host}${request_path}`;
    
    // Decodificar la clave privada
    const decodedPrivateKey = Buffer.from(key_secret, 'base64');
    
    const token = jwt.sign(
      {
        iss: "cdp",
        nbf: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 120, // JWT expires in 120 seconds
        sub: key_name,
        uri,
      },
      decodedPrivateKey,
      {
        algorithm,
        header: {
          kid: key_name,
          nonce: crypto.randomBytes(16).toString("hex"),
        },
      }
    );

    console.log('✅ JWT generado según CDP docs oficiales');
    console.log('🔑 Token (primeros 50 chars):', token.substring(0, 50) + '...');
    
    res.json({
      success: true,
      jwt: token,
      expiresIn: '120 seconds (2 minutes)',
      walletAddress: walletAddress,
      method: 'CDP Official Docs',
      algorithm: algorithm,
      uri: uri
    });
    
  } catch (error) {
    console.error('❌ Error en /api/generate-jwt-cdp:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// Nueva ruta para generar Buy Quote usando CDP API
app.post('/api/generate-buy-quote', async (req, res) => {
  try {
    const { walletAddress, amount, country = 'CO', subdivision = 'CO-DC' } = req.body;
    
    if (!walletAddress || !amount) {
      return res.status(400).json({ 
        error: 'walletAddress y amount son requeridos' 
      });
    }

    console.log('🚀 Generando Buy Quote para:', { walletAddress, amount, country: 'US', subdivision: 'N/A', paymentMethod: 'CARD' });
    
    // Generar JWT fresco con POST y /onramp/v1/buy/quote
    const jwtToken = await generateCDPJWT("POST", "/onramp/v1/buy/quote");
    
    // Preparar payload para Buy Quote API según CDP docs
    const requestBody = {
      country: "US",
      destinationAddress: walletAddress,
      paymentAmount: amount.toString(),
      paymentCurrency: "USD",  // ✅ Usar COP como fiat currencyß
      purchaseCurrency: "CGLD",
      paymentMethod: "CARD",
      purchaseNetwork: "celo",
    };

    console.log('📤 Llamando a CDP Buy Quote API con payload:', requestBody);
    
    // Llamar a CDP Buy Quote API
    const response = await fetch('https://api.developer.coinbase.com/onramp/v1/buy/quote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`,
      },
      body: JSON.stringify(requestBody)
    });

    console.log('📡 Buy Quote API Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error de CDP Buy Quote API:', response.status, errorText);
      
      return res.status(response.status).json({
        error: 'Error de CDP Buy Quote API',
        status: response.status,
        details: errorText
      });
    }

    const data = await response.json();
    console.log('✅ Buy Quote generado exitosamente');
    console.log('📊 Quote data:', data);
    
    // Generar URL de onramp optimizada usando los parámetros de la documentación CDP
    const optimizedOnrampUrl = generateOptimizedOnrampUrl(data.onramp_url, {
      defaultNetwork: 'celo',
      defaultAsset: 'CGLD',
      presetFiatAmount: amount,
      fiatCurrency: 'USD',
      defaultPaymentMethod: 'CARD',
      defaultExperience: 'buy'
    });

    // Formatear valores en Pesos Colombianos y CELO usando precio real de Chainlink
    const formattedQuote = {
      // Solo información esencial en COP y CELO
      monto_cop: await formatCOP(amount), // Monto en COP
      celo_a_comprar: parseFloat(data.purchase_amount.value).toFixed(6), // CELO con 6 decimales
      fee_transaccion: await formatCOP(data.coinbase_fee.value), // Fee en COP
      fee_red: await formatCOP(data.network_fee.value), // Network fee en COP
      total_fees: await formatCOP(parseFloat(data.coinbase_fee.value) + parseFloat(data.network_fee.value)), // Total fees en COP
      quote_id: data.quote_id,
      onramp_url: data.onramp_url
    };

    res.json({
      success: true,
      quote: formattedQuote,
      jwt: jwtToken,
      walletAddress: walletAddress,
      // Solo valores en COP y CELO - sin USD
      monto_cop: await formatCOP(amount),
      celo_a_comprar: parseFloat(data.purchase_amount.value).toFixed(6),
      onrampUrl: data.onramp_url,
      optimizedOnrampUrl: optimizedOnrampUrl,
      sessionToken: extractSessionToken(data.onramp_url),
      // Solo mostrar el tipo de cambio en COP, no en USD
      tipo_cambio: `1 USD = ${(await getCOPUSDPrice()).toLocaleString('es-CO')} COP`
    });
    
  } catch (error) {
    console.error('❌ Error en /api/generate-buy-quote:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// Ruta para obtener Buy Options
app.get('/api/buy-options', async (req, res) => {
  try {
    const { country = 'CO', networks = 'celo' } = req.query;
    
    console.log('🚀 Probando Buy Options API para:', { country, networks });
    
    // Generar JWT fresco
    const jwtToken = await generateCDPJWT("GET", "/onramp/v1/buy/options");
    
    // Llamar a CDP Buy Options API
    const response = await fetch(`https://api.developer.coinbase.com/onramp/v1/buy/options?country=${country}&networks=${networks}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${jwtToken}`,
      }
    });
    
    console.log('📡 Buy Options API Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error de CDP Buy Options API:', response.status, errorText);
      
      return res.status(response.status).json({
        error: 'Error de CDP Buy Options API',
        status: response.status,
        details: errorText
      });
    }
    
    const data = await response.json();
    console.log('✅ Buy Options obtenidos exitosamente');
    
    // 🔍 INVESTIGACIÓN PROFUNDA: Ver estructura completa de la respuesta
    console.log('🔍 INVESTIGACIÓN: Estructura completa de Buy Options response:');
    console.log('📊 Response completa:', JSON.stringify(data, null, 2));
    console.log('📊 Response keys:', Object.keys(data));
    console.log('📊 Response.sessionToken:', data.sessionToken);
    console.log('📊 Response.token:', data.token);
    console.log('📊 Response.quote:', data.quote);
    console.log('📊 Response.onrampUrl:', data.onrampUrl);
    
    // Buscar sessionToken en diferentes ubicaciones
    let sessionToken = null;
    if (data.sessionToken) {
      sessionToken = data.sessionToken;
      console.log('✅ SessionToken encontrado en response.sessionToken:', sessionToken);
    } else if (data.token) {
      sessionToken = data.token;
      console.log('✅ Token encontrado en response.token:', sessionToken);
    } else if (data.quote?.sessionToken) {
      sessionToken = data.quote.sessionToken;
      console.log('✅ SessionToken encontrado en response.quote.sessionToken:', sessionToken);
    } else if (data.onrampUrl) {
      sessionToken = data.onrampUrl;
      console.log('✅ onrampUrl encontrado en response.onrampUrl:', sessionToken);
    } else {
      console.log('⚠️ No se encontró sessionToken en ninguna ubicación');
    }
    
    // Agregar información en Pesos Colombianos
    const enhancedData = {
      ...data,
      info_cop: {
        country: country,
        networks: networks,
        note: 'Valores disponibles para Colombia en Pesos Colombianos',
        exchange_rate: '1 USD = 4,000 COP (aproximado)',
        supported_currencies: ['COP', 'USD'],
        supported_networks: ['celo']
      }
    };

    res.json({
      success: true,
      data: enhancedData,
      jwt: jwtToken,
      country: country,
      networks: networks,
      sessionToken: sessionToken, // Agregar sessionToken si se encuentra
      note: 'Buy Options obtenidos - investigando estructura para sessionToken',
      info_cop: enhancedData.info_cop
    });
    
  } catch (error) {
    console.error('❌ Error en /api/buy-options:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// Ruta de health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'CDP JWT Generator',
    version: '1.0.0'
  });
});

// Función para obtener precio real de COP/USD desde Exchange Rate API
async function getCOPUSDPrice() {
  try {
    // Obtener precio real desde Exchange Rate API
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    
    if (!response.ok) {
      throw new Error(`Exchange Rate API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extraer el precio COP/USD
    const copUsdPrice = data.rates?.COP;
    
    if (!copUsdPrice) {
      throw new Error('COP rate not found in response');
    }
    
    console.log('💰 Precio COP/USD obtenido de Exchange Rate API:', copUsdPrice);
    return copUsdPrice;
    
  } catch (error) {
    console.error('❌ Error obteniendo precio COP/USD:', error);
    throw new Error(`No se pudo obtener precio COP/USD: ${error.message}`);
  }
}

// Función para formatear valores en Pesos Colombianos
async function formatCOP(value, decimals = 4) {
  try {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '$0';
    
    // Obtener precio real de COP/USD desde Exchange Rate API
    const copUsdPrice = await getCOPUSDPrice();
    
    // Convertir USD a COP usando precio real
    const copValue = numValue * copUsdPrice;
    
    // Determinar si usar decimales basado en el valor
    let finalDecimals = decimals;
    if (copValue >= 100) {
      finalDecimals = 0; // Sin decimales para valores >= 100 COP
    }
    
    // Formatear manualmente con punto para miles y coma para decimales
    let formatted;
    if (finalDecimals === 0) {
      // Sin decimales: usar punto para miles
      formatted = Math.round(copValue).toLocaleString('es-CO');
    } else {
      // Con decimales: usar punto para miles y coma para decimales
      const roundedValue = Math.round(copValue * Math.pow(10, finalDecimals)) / Math.pow(10, finalDecimals);
      const parts = roundedValue.toString().split('.');
      
      // Formatear parte entera con puntos para miles
      const integerPart = parseInt(parts[0]).toLocaleString('es-CO');
      
      if (parts.length > 1) {
        // Agregar parte decimal con coma
        const decimalPart = parts[1].padEnd(finalDecimals, '0');
        formatted = `${integerPart},${decimalPart}`;
      } else {
        formatted = integerPart;
      }
    }
    
    return `$${formatted}`;
  } catch (error) {
    console.error('❌ Error formateando valor COP:', error);
    throw error; // Re-lanzar el error para manejarlo en el nivel superior
  }
}

// Función para extraer sessionToken de una URL de onramp
function extractSessionToken(onrampUrl) {
  try {
    const url = new URL(onrampUrl);
    return url.searchParams.get('sessionToken');
  } catch (error) {
    console.error('❌ Error extrayendo sessionToken:', error);
    return null;
  }
}

// Función para generar URL de onramp optimizada según documentación CDP
function generateOptimizedOnrampUrl(baseUrl, params) {
  try {
    const url = new URL(baseUrl);
    
    // Agregar parámetros de optimización según documentación CDP
    if (params.defaultNetwork) {
      url.searchParams.set('defaultNetwork', params.defaultNetwork);
    }
    if (params.defaultAsset) {
      url.searchParams.set('defaultAsset', params.defaultAsset);
    }
    if (params.presetFiatAmount) {
      url.searchParams.set('presetFiatAmount', params.presetFiatAmount);
    }
    if (params.fiatCurrency) {
      url.searchParams.set('fiatCurrency', params.fiatCurrency);
    }
    if (params.defaultPaymentMethod) {
      url.searchParams.set('defaultPaymentMethod', params.defaultPaymentMethod);
    }
    if (params.defaultExperience) {
      url.searchParams.set('defaultExperience', params.defaultExperience);
    }
    
    console.log('🔗 URL de onramp optimizada generada:', url.toString());
    return url.toString();
    
  } catch (error) {
    console.error('❌ Error generando URL optimizada:', error);
    return baseUrl; // Retornar URL original si hay error
  }
}

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 Servidor CDP JWT iniciado en puerto:', PORT);
  console.log('🌐 Escuchando en todas las interfaces (0.0.0.0)');
  console.log('📋 Configuración CDP:', {
    appId: CDP_CONFIG.appId ? '✅ Configurado' : '❌ No configurado',
    apiKey: CDP_CONFIG.apiKey ? '✅ Configurado' : '❌ No configurado',
    privateKey: CDP_CONFIG.privateKey ? '✅ Configurado' : '❌ No configurado'
  });
  console.log('🌐 Frontend URL:', config.cors.frontendUrl);
  console.log('🔗 Health check: http://localhost:' + PORT + '/api/health');
  console.log('🔗 Health check: http://127.0.0.1:' + PORT + '/api/health');
  console.log('🔗 Health check: http://0.0.0.0:' + PORT + '/api/health');
});
