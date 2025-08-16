const express = require('express');
const cors = require('cors');
const { generateJwt } = require('@coinbase/cdp-sdk/auth');
const config = require('./config');

const app = express();
const PORT = config.port;

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

// Función para generar JWT usando el SDK oficial de CDP
async function generateCDPJWT(walletAddress) {
  try {
    console.log('🔐 Generando JWT usando SDK oficial de CDP...');
    console.log('📋 Configuración:', {
      appId: CDP_CONFIG.appId,
      apiKey: CDP_CONFIG.apiKey,
      walletAddress: walletAddress
    });

    // Usar el SDK oficial de CDP para generar JWT
    const jwt = await generateJwt({
      apiKeyId: CDP_CONFIG.apiKey,
      apiKeySecret: CDP_CONFIG.privateKey,
      requestMethod: "GET",
      requestHost: "api.developer.coinbase.com",
      requestPath: "/onramp/v1/buy/options",
      expiresIn: 120 // 2 minutos según CDP docs
    });

    console.log('✅ JWT generado exitosamente usando SDK oficial de CDP');
    console.log('🔑 Token (primeros 50 chars):', jwt.substring(0, 50) + '...');
    
    return jwt;
  } catch (error) {
    console.error('❌ Error generando JWT con SDK oficial:', error);
    throw new Error(`Error generando JWT con SDK oficial: ${error.message}`);
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
    
    const jwtToken = await generateCDPJWT(walletAddress);
    
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
    
    // Primero generar JWT
    const jwtToken = await generateCDPJWT(walletAddress);
    
    // Preparar payload para CDP API (usando solo addresses según nueva API)
    const payload = {
      addresses: [
        {
          address: walletAddress,
          blockchains: ["celo"]
        }
      ],
      assets: ["CELO"]
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

    console.log('🚀 Generando Buy Quote para:', { walletAddress, amount, country, subdivision });
    
    // Primero generar JWT
    const jwtToken = await generateCDPJWT(walletAddress);
    
    // Preparar payload para Buy Quote API según CDP docs
    const requestBody = {
      country: country,
      destinationAddress: walletAddress,
      paymentAmount: amount.toString(),
      paymentCurrency: "COP",
      paymentMethod: "UNSPECIFIED",
      purchaseCurrency: "CELO",
      purchaseNetwork: "celo",
      subdivision: subdivision
    };

    console.log('📤 Llamando a CDP Buy Quote API con payload:', requestBody);
    
    // Llamar a CDP Buy Quote API
    const response = await fetch('https://api.developer.coinbase.com/onramp/v1/buy/quote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
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
    
    res.json({
      success: true,
      quote: data,
      jwt: jwtToken,
      walletAddress: walletAddress,
      amount: amount,
      onrampUrl: data.onrampUrl // Esta URL contiene el session token
    });
    
  } catch (error) {
    console.error('❌ Error en /api/generate-buy-quote:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// Nueva ruta para probar Buy Options API
app.get('/api/buy-options', async (req, res) => {
  try {
    const { country = 'CO', networks = 'celo' } = req.query;
    
    console.log('🚀 Probando Buy Options API para:', { country, networks });
    
    // Generar JWT fresco
    const jwtToken = await generateCDPJWT('0x8f51DC0791CdDDDCE08052FfF939eb7cf0c17856');
    
    // Llamar a CDP Buy Options API
    const response = await fetch(`https://api.developer.coinbase.com/onramp/v1/buy/options?country=${country}&networks=${networks}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Accept': 'application/json'
      }
    });

    console.log('📡 Buy Options API Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error de CDP Buy Options API:', response.status, errorText);
      
      return res.status(response.status).json({
        error: 'Error de CDP Buy Options API',
        status: response.status,
        details: errorText,
        jwt: jwtToken.substring(0, 50) + '...'
      });
    }

    const data = await response.json();
    console.log('✅ Buy Options obtenidos exitosamente');
    
    res.json({
      success: true,
      data: data,
      jwt: jwtToken.substring(0, 50) + '...',
      country: country,
      networks: networks
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
