const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
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

// Función para generar JWT real para CDP
function generateCDPJWT(walletAddress) {
  try {
    console.log('🔐 Generando JWT real para CDP...');
    console.log('📋 Configuración:', {
      appId: CDP_CONFIG.appId,
      apiKey: CDP_CONFIG.apiKey,
      walletAddress: walletAddress
    });

    // Payload del JWT según documentación de CDP
    const payload = {
      iss: CDP_CONFIG.apiKey,           // Issuer (API Key)
      sub: CDP_CONFIG.appId,            // Subject (App ID)
      aud: 'https://api.developer.coinbase.com', // Audience
      iat: Math.floor(Date.now() / 1000),       // Issued at
      exp: Math.floor(Date.now() / 1000) + 3600, // Expires in 1 hour
      wallet_address: walletAddress,    // Wallet address for this session
      scope: 'onramp:write'             // Scope for onramp operations
    };

    console.log('📤 Payload JWT:', payload);

    // Generar JWT usando la private key
    // Nota: La private key está en base64, necesitamos decodificarla
    const decodedPrivateKey = Buffer.from(CDP_CONFIG.privateKey, 'base64');
    
    const token = jwt.sign(payload, decodedPrivateKey, {
      algorithm: 'HS256',
      header: {
        typ: 'JWT',
        alg: 'HS256'
      }
    });

    console.log('✅ JWT generado exitosamente');
    console.log('🔑 Token (primeros 50 chars):', token.substring(0, 50) + '...');
    
    return token;
  } catch (error) {
    console.error('❌ Error generando JWT:', error);
    throw new Error(`Error generando JWT: ${error.message}`);
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
    
    const jwtToken = generateCDPJWT(walletAddress);
    
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
    const jwtToken = generateCDPJWT(walletAddress);
    
    // Preparar payload para CDP API
    const payload = {
      addresses: [
        {
          address: walletAddress,
          blockchains: ["celo"]
        }
      ],
      assets: ["CELO"],
      destinationWallets: [
        {
          address: walletAddress,
          assets: ["CELO"],
          blockchains: ["celo"],
          supportedNetworks: ["celo"]
        }
      ]
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
