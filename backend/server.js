const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const config = require("./config");

const app = express();
const PORT = config.port;

const { generateJwt } = require("@coinbase/cdp-sdk/auth");
const PriceService = require("./priceService");

// Middleware de CORS y JSON / CORS and JSON Middleware
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3001",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());

// Configuración de CDP (Coinbase Developer Platform) / CDP Configuration
const CDP_CONFIG = {
  appId: config.cdp.appId,
  apiKey: config.cdp.apiKey,
  privateKey: config.cdp.privateKey,
};

// Inicializar servicio de precios / Initialize price service
const priceService = new PriceService();

// Función para generar JWT para CDP / Function to generate JWT for CDP
async function generateCDPJWT(
  requestMethod = "GET",
  requestPath = "/onramp/v1/buy/options",
) {
  try {
    // Generar JWT usando el SDK de CDP / Generate JWT using CDP SDK
    const jwtToken = await generateJwt({
      apiKeyId: CDP_CONFIG.apiKey,
      apiKeySecret: CDP_CONFIG.privateKey,
      requestMethod: requestMethod,
      requestHost: "api.developer.coinbase.com",
      requestPath: requestPath,
      expiresIn: 120, // opcional (por defecto 120 segundos) / optional (default 120 seconds)
    });

    console.log(
      "✅ JWT generado exitosamente manualmente / JWT generated successfully manually",
    );
    console.log(
      "🔑 Token (primeros 50 chars): / Token (first 50 chars):",
      jwtToken.substring(0, 50) + "...",
    );

    return jwtToken;
  } catch (error) {
    console.error(
      "❌ Error generando JWT manualmente / Error generating JWT manually:",
      error,
    );
    throw new Error(
      `Error generando JWT manualmente / Error generating JWT manually: ${error.message}`,
    );
  }
}

// Ruta para generar JWT (JSON Web Token) / Route to generate JWT
app.post("/api/generate-jwt", async (req, res) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        error: "walletAddress es requerido / walletAddress is required",
      });
    }

    console.log(
      "🚀 Solicitud de JWT para wallet / JWT request for wallet:",
      walletAddress,
    );

    const jwtToken = await generateCDPJWT();

    res.json({
      success: true,
      jwt: jwtToken,
      expiresIn: "1 hora / 1 hour",
      walletAddress: walletAddress,
    });
  } catch (error) {
    console.error(
      "❌ Error en /api/generate-jwt / Error in /api/generate-jwt:",
      error,
    );
    res.status(500).json({
      error: "Error interno del servidor / Internal server error",
      details: error.message,
    });
  }
});

// Ruta para generar session token usando JWT / Route to generate session token using JWT
app.post("/api/generate-session-token", async (req, res) => {
  try {
    const { walletAddress, amount } = req.body;

    if (!walletAddress || !amount) {
      return res.status(400).json({
        error:
          "walletAddress y amount son requeridos / walletAddress and amount are required",
      });
    }

    console.log(
      "🚀 Generando session token para / Generating session token for:",
      { walletAddress, amount },
    );

    // Primero generar JWT con POST y /onramp/v1/token / First generate JWT with POST and /onramp/v1/token
    const jwtToken = await generateCDPJWT("POST", "/onramp/v1/token");

    // Preparar payload para CDP API según ejemplo oficial / Prepare payload for CDP API according to official example
    const payload = {
      destinationWallets: [
        {
          address: walletAddress,
          assets: ["CGLD"],
          blockchains: ["celo"],
        },
      ],
      sourceCurrency: "USD",
      destinationCurrency: "CGLD",
    };

    console.log(
      "📤 Llamando a CDP API con payload / Calling CDP API with payload:",
      payload,
    );

    // Llamar a CDP API para generar session token / Call CDP API to generate session token
    const response = await fetch(
      "https://api.developer.coinbase.com/onramp/v1/token",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    console.log("📡 Response status / Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "❌ Error de CDP API / CDP API Error:",
        response.status,
        errorText,
      );

      return res.status(response.status).json({
        error: "Error de CDP API / CDP API Error",
        status: response.status,
        details: errorText,
      });
    }

    const data = await response.json();
    console.log(
      "✅ Session token generado exitosamente / Session token generated successfully",
    );

    res.json({
      success: true,
      sessionToken: data.token,
      jwt: jwtToken,
      walletAddress: walletAddress,
      amount: amount,
    });
  } catch (error) {
    console.error(
      "❌ Error en /api/generate-session-token / Error in /api/generate-session-token:",
      error,
    );
    res.status(500).json({
      error: "Error interno del servidor / Internal server error",
      details: error.message,
    });
  }
});

// Nueva ruta para generar JWT según CDP docs oficiales / New route to generate JWT according to official CDP docs
app.post("/api/generate-jwt-cdp", async (req, res) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        error: "walletAddress es requerido / walletAddress is required",
      });
    }

    console.log(
      "🚀 Generando JWT según CDP docs oficiales para wallet / Generating JWT according to official CDP docs for wallet:",
      walletAddress,
    );

    // Configuración según CDP docs / Configuration according to CDP docs
    const key_name = CDP_CONFIG.apiKey;
    const key_secret = CDP_CONFIG.privateKey;
    const request_method = "POST";
    const request_host = "api.developer.coinbase.com";
    const request_path = "/onramp/v1/token";

    const algorithm = "ES256";
    const uri = `${request_method} ${request_host}${request_path}`;

    // Decodificar la clave privada / Decode private key
    const decodedPrivateKey = Buffer.from(key_secret, "base64");

    const token = jwt.sign(
      {
        iss: "cdp",
        nbf: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 120, // JWT expires in 120 seconds / JWT expira en 120 segundos
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
      },
    );

    console.log(
      "✅ JWT generado según CDP docs oficiales / JWT generated according to official CDP docs",
    );
    console.log(
      "🔑 Token (primeros 50 chars): / Token (first 50 chars):",
      token.substring(0, 50) + "...",
    );

    res.json({
      success: true,
      jwt: token,
      expiresIn: "120 seconds (2 minutes)",
      walletAddress: walletAddress,
      method: "CDP Official Docs",
      algorithm: algorithm,
      uri: uri,
    });
  } catch (error) {
    console.error(
      "❌ Error en /api/generate-jwt-cdp / Error in /api/generate-jwt-cdp:",
      error,
    );
    res.status(500).json({
      error: "Error interno del servidor / Internal server error",
      details: error.message,
    });
  }
});



// Ruta para obtener precio actual COP/USD / Route to get current COP/USD price
app.get("/api/price/cop-usd", async (req, res) => {
  try {
    const { network = "mainnet" } = req.query;

    console.log(
      "💰 Obteniendo precio COP/USD para red / Getting COP/USD price for network:",
      network,
    );

    const price = await priceService.getCOPUSDPrice(network);
    const formattedPrice = await priceService.getFormattedPrice(network);

    res.json({
      success: true,
      price: price,
      formattedPrice: formattedPrice,
      network: network,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "❌ Error obteniendo precio COP/USD / Error getting COP/USD price:",
      error,
    );
    res.status(500).json({
      error: "Error obteniendo precio / Error getting price",
      details: error.message,
    });
  }
});

// Nueva ruta para obtener precios de CELO y cCOP / New route to get CELO and cCOP prices
app.get("/api/price/celo-ccop", async (req, res) => {
  try {
    const celoPrice = await priceService.getCELOPriceUSD();
    const cCOPPrice = await priceService.getCCOPPriceUSD();

    res.json({
      success: true,
      celo: {
        price: celoPrice,
        currency: "USD",
      },
      cCOP: {
        price: cCOPPrice,
        currency: "USD",
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error en /api/price/celo-ccop:", error);
    res.status(500).json({
      error:
        "Error obteniendo precios de CELO/cCOP / Error getting CELO/cCOP prices",
      details: error.message,
    });
  }
});

// Ruta para generar Session Token siguiendo el ejemplo oficial de Coinbase / Route to generate Session Token following official Coinbase example
app.get("/api/buy-options", async (req, res) => {
  try {
    const { country = "CO", networks = "celo", walletAddress } = req.query;

    if (!walletAddress) {
      return res.status(400).json({
        error:
          "walletAddress es requerido para generar session token / walletAddress is required to generate session token",
      });
    }

    console.log(
      "🚀 Generando Session Token para / Generating Session Token for:",
      { country, networks, walletAddress },
    );

    // Generar JWT fresco para /onramp/v1/token / Generate fresh JWT for /onramp/v1/token
    const jwtToken = await generateCDPJWT("POST", "/onramp/v1/token");

    // Preparar payload siguiendo exactamente el ejemplo oficial de Coinbase / Prepare payload following exactly the official Coinbase example
    const tokenPayload = {
      destinationWallets: [
        {
          address: walletAddress,
          assets: ["CELO"],
          blockchains: ["celo"],
          supportedNetworks: ["celo"],
        },
      ],
    };

    console.log(
      "📤 Llamando a CDP Token API con payload oficial / Calling CDP Token API with official payload:",
      tokenPayload,
    );

    // Llamar a CDP Token API para generar session token / Call CDP Token API to generate session token
    const response = await fetch(
      "https://api.developer.coinbase.com/onramp/v1/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify(tokenPayload),
      },
    );

    console.log(
      "📡 CDP Token API Response status / CDP Token API Response status:",
      response.status,
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "❌ Error de CDP Token API / CDP Token API Error:",
        response.status,
        errorText,
      );

      return res.status(response.status).json({
        error: "Error de CDP Token API / CDP Token API Error",
        status: response.status,
        details: errorText,
      });
    }

    const data = await response.json();
    console.log(
      "✅ Session Token generado exitosamente / Session Token generated successfully",
    );

    // Buscar sessionToken en la respuesta / Search for sessionToken in response
    let sessionToken = null;
    if (data.token) {
      sessionToken = data.token;
      console.log(
        "✅ SessionToken encontrado en response.token / SessionToken found in response.token:",
        sessionToken,
      );
    } else if (data.sessionToken) {
      sessionToken = data.sessionToken;
      console.log(
        "✅ SessionToken encontrado en response.sessionToken / SessionToken found in response.sessionToken:",
        sessionToken,
      );
    } else {
      console.log(
        "⚠️ No se encontró sessionToken en la respuesta / No sessionToken found in response",
      );
      console.log(
        "📊 Estructura de respuesta / Response structure:",
        JSON.stringify(data, null, 2),
      );
    }

    // Agregar información en Pesos Colombianos / Add information in Colombian Pesos
    const enhancedData = {
      ...data,
      sessionToken: sessionToken,
      info_cop: {
        country: country,
        networks: networks,
        note: "Session Token generado para Colombia en Pesos Colombianos / Session Token generated for Colombia in Colombian Pesos",
        exchange_rate:
          "1 USD = 4,000 COP (aproximado) / 1 USD = 4,000 COP (approximate)",
        supported_currencies: ["COP", "USD"],
        supported_networks: ["celo"],
      },
    };

    res.json({
      success: true,
      data: enhancedData,
      sessionToken: sessionToken,
      jwt: jwtToken,
      country: country,
      networks: networks,
      sessionToken: sessionToken, // Agregar sessionToken si se encuentra / Add sessionToken if found
      note: "Buy Options obtenidos - investigando estructura para sessionToken / Buy Options obtained - investigating structure for sessionToken",
      info_cop: enhancedData.info_cop,
    });
  } catch (error) {
    console.error(
      "❌ Error en /api/buy-options / Error in /api/buy-options:",
      error,
    );
    res.status(500).json({
      error: "Error interno del servidor / Internal server error",
      details: error.message,
    });
  }
});

// Ruta de health check / Health check route
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "CDP JWT Generator",
    version: "1.0.0",
  });
});

// Ruta para generar Buy Quote (nueva) / Route to generate Buy Quote (new)
app.post("/api/generate-buy-quote", async (req, res) => {
  try {
    const {
      walletAddress,
      amount,
      country = "US",
    } = req.body;

    if (!walletAddress || !amount) {
      return res.status(400).json({
        error:
          "walletAddress y amount son requeridos / walletAddress and amount are required",
      });
    }

    console.log("🚀 Generando Buy Quote para / Generating Buy Quote for:", {
      walletAddress,
      amount,
      country,
    });

    // Validar monto mínimo (CDP requiere mínimo $1 USD) / Validate minimum amount (CDP requires minimum $1 USD)
    if (amount < 1) {
      return res.status(400).json({
        error: "El monto mínimo es $1 USD / Minimum amount is $1 USD",
        amount: amount,
        country: country,
      });
    }

    // Generar JWT para session token API / Generate JWT for session token API
    const jwtToken = await generateCDPJWT("POST", "/onramp/v1/token");

    // Preparar payload para generar session token / Prepare payload to generate session token
    const sessionTokenPayload = {
      destinationWallets: [
        {
          address: walletAddress,
          assets: ["CGLD"],
          blockchains: ["celo"],
        },
      ],
      sourceCurrency: "USD",
      destinationCurrency: "CGLD",
      country: country,
    };

    console.log(
      "📤 Llamando a CDP Session Token API con payload / Calling CDP Session Token API with payload:",
      sessionTokenPayload,
    );

    // Llamar a CDP API para generar session token / Call CDP API to generate session token
    const response = await fetch(
      "https://api.developer.coinbase.com/onramp/v1/token",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sessionTokenPayload),
      },
    );

    console.log(
      "📡 CDP Session Token API Response status / CDP Session Token API Response status:",
      response.status,
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "❌ Error de CDP Session Token API / CDP Session Token API Error:",
        response.status,
        errorText,
      );

      return res.status(response.status).json({
        error: "Error de CDP Session Token API / CDP Session Token API Error",
        status: response.status,
        details: errorText,
      });
    }

    const data = await response.json();
    console.log(
      "✅ Session token generado exitosamente / Session token generated successfully",
    );

    // Generar URL de onramp con session token / Generate onramp URL with session token
    const onrampUrl = `https://pay.coinbase.com/buy/select-asset?appId=${process.env.CDP_APP_ID || 'default'}&sessionToken=${data.token}&destinationWallets=${encodeURIComponent(JSON.stringify([{
      address: walletAddress,
      assets: ["CGLD"],
      blockchains: ["celo"],
    }]))}&sourceAmount=${amount}&sourceCurrency=USD&destinationCurrency=CGLD&country=${country}`;

    console.log(
      "📤 Generando URL de onramp / Generating onramp URL:",
      onrampUrl,
    );

    console.log(
      "✅ URL de onramp generada exitosamente / Onramp URL generated successfully",
    );

    // Calcular valores en COP usando PriceService / Calculate values in COP using PriceService
    const exchangeRate = await priceService.getCOPUSDPrice("mainnet");
    const amountCOP = amount * exchangeRate;

    // Formatear respuesta / Format response
    const formattedResponse = {
      success: true,
      onrampUrl: onrampUrl,
      monto_usd: `$${parseFloat(amount).toFixed(2)} USD`,
      monto_cop: `$${amountCOP.toLocaleString("es-CO")} COP`,
      tipo_cambio: `1 USD = ${exchangeRate.toLocaleString("es-CO")} COP`,
      country: country,
      walletAddress: walletAddress,
      exchangeRate: exchangeRate,
    };

    res.json(formattedResponse);
  } catch (error) {
    console.error(
      "❌ Error en /api/generate-buy-quote / Error in /api/generate-buy-quote:",
      error,
    );
    res.status(500).json({
      error: "Error interno del servidor / Internal server error",
      details: error.message,
    });
  }
});

// Ruta para obtener información del contrato de swap / Route to get swap contract information
app.get("/api/swap-contract", (req, res) => {
  try {
    const contractInfo = getSwapContractInfo();
    res.json({
      success: true,
      contract: contractInfo,
    });
  } catch (error) {
    console.error(
      "❌ Error obteniendo información del contrato / Error getting contract information:",
      error,
    );
    res.status(500).json({
      error: "Error interno del servidor / Internal server error",
      details: error.message,
    });
  }
});



// Función para obtener precio real de COP/USD desde Exchange Rate API / Function to get real COP/USD price from Exchange Rate API
async function getCOPUSDPrice() {
  try {
    // Obtener precio real desde Exchange Rate API / Get real price from Exchange Rate API
    const response = await fetch(
      "https://api.exchangerate-api.com/v4/latest/USD",
    );

    if (!response.ok) {
      throw new Error(
        `Exchange Rate API responded with status: ${response.status}`,
      );
    }

    const data = await response.json();

    // Extraer el precio COP/USD / Extract COP/USD price
    const copUsdPrice = data.rates?.COP;

    if (!copUsdPrice) {
      throw new Error("COP rate not found in response");
    }

    console.log(
      "💰 Precio COP/USD obtenido de Exchange Rate API / COP/USD price obtained from Exchange Rate API:",
      copUsdPrice,
    );
    return copUsdPrice;
  } catch (error) {
    console.error(
      "❌ Error obteniendo precio COP/USD / Error getting COP/USD price:",
      error,
    );
    throw new Error(
      `No se pudo obtener precio COP/USD / Could not get COP/USD price: ${error.message}`,
    );
  }
}

// Función para formatear valores en Pesos Colombianos / Function to format values in Colombian Pesos
async function formatCOP(value, decimals = 4) {
  try {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return "$0";

    // ✅ El valor viene en USD desde CDP, necesitamos convertir a COP / Value comes in USD from CDP, we need to convert to COP
    const copUsdPrice = await getCOPUSDPrice();
    const copValue = numValue * copUsdPrice;

    // Determinar si usar decimales basado en el valor / Determine whether to use decimals based on value
    let finalDecimals = decimals;
    if (copValue >= 100) {
      finalDecimals = 0; // Sin decimales para valores >= 100 COP / No decimals for values >= 100 COP
    }

    // Formatear manualmente con punto para miles y coma para decimales / Format manually with dot for thousands and comma for decimals
    let formatted;
    if (finalDecimals === 0) {
      // Sin decimales: usar punto para miles / No decimals: use dot for thousands
      formatted = Math.round(copValue).toLocaleString("es-CO");
    } else {
      // Con decimales: usar punto para miles y coma para decimales / With decimals: use dot for thousands and comma for decimals
      const roundedValue =
        Math.round(copValue * Math.pow(10, finalDecimals)) /
        Math.pow(10, finalDecimals);
      const parts = roundedValue.toString().split(".");

      // Formatear parte entera con puntos para miles / Format integer part with dots for thousands
      const integerPart = parseInt(parts[0]).toLocaleString("es-CO");

      if (parts.length > 1) {
        // Agregar parte decimal con coma / Add decimal part with comma
        const decimalPart = parts[1].padEnd(finalDecimals, "0");
        formatted = `${integerPart},${decimalPart}`;
      } else {
        formatted = integerPart;
      }
    }

    return `$${formatted}`;
  } catch (error) {
    console.error(
      "❌ Error formateando valor COP / Error formatting COP value:",
      error,
    );
    throw error; // Re-lanzar el error para manejarlo en el nivel superior / Re-throw error to handle it at upper level
  }
}

// Función para extraer sessionToken de una URL de onramp / Function to extract sessionToken from onramp URL
function extractSessionToken(onrampUrl) {
  try {
    const url = new URL(onrampUrl);
    return url.searchParams.get("sessionToken");
  } catch (error) {
    console.error(
      "❌ Error extrayendo sessionToken / Error extracting sessionToken:",
      error,
    );
    return null;
  }
}

// Función para generar URL de onramp optimizada según documentación de CDP / Function to generate optimized onramp URL according to CDP documentation
function generateOptimizedOnrampUrl(baseUrl, params) {
  try {
    const url = new URL(baseUrl);

    // Agregar parámetros de optimización según documentación de CDP / Add optimization parameters according to CDP documentation
    if (params.defaultNetwork) {
      url.searchParams.set("defaultNetwork", params.defaultNetwork);
    }
    if (params.defaultAsset) {
      url.searchParams.set("defaultAsset", params.defaultAsset);
    }
    if (params.presetFiatAmount) {
      url.searchParams.set("presetFiatAmount", params.presetFiatAmount);
    }
    if (params.fiatCurrency) {
      url.searchParams.set("fiatCurrency", params.fiatCurrency);
    }
    if (params.defaultPaymentMethod) {
      url.searchParams.set("defaultPaymentMethod", params.defaultPaymentMethod);
    }
    if (params.defaultExperience) {
      url.searchParams.set("defaultExperience", params.defaultExperience);
    }

    // Agregar dirección del contrato para el swap automático / Add contract address for automatic swap
    // TODO: Reemplazar con la dirección real del contrato deployado / TODO: Replace with real deployed contract address
    const swapContractAddress = "0x0000000000000000000000000000000000000000"; // Dirección temporal / Temporary address
    url.searchParams.set("swapContract", swapContractAddress);

    // Agregar dirección del usuario para que Coinbase sepa a dónde enviar cCOP / Add user address so Coinbase knows where to send cCOP
    if (params.walletAddress) {
      url.searchParams.set("userWallet", params.walletAddress);
      url.searchParams.set("destinationAddress", params.walletAddress);
    }

    console.log(
      "🔗 URL de onramp optimizada generada / Optimized onramp URL generated:",
      url.toString(),
    );
    return url.toString();
  } catch (error) {
    console.error(
      "❌ Error generando URL optimizada / Error generating optimized URL:",
      error,
    );
    return baseUrl; // Retornar URL original si hay error / Return original URL if there's an error
  }
}

// Función para obtener información del contrato de swap / Function to get swap contract information
function getSwapContractInfo() {
  return {
    address: "0x0000000000000000000000000000000000000000", // Placeholder
    network: "celo",
    fee: "0.5%",
    description:
      "Contrato que recibe Celo y hace swap automático a cCOP / Contract that receives Celo and makes automatic swap to cCOP",
    status: "pending_deploy",
    tokens: {
      celo: "0x471EcE3750Da237f93B8E339c536989b8978a438",
      cusd: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
      ccop: "0x8A567e2aE79CA692Bd748aB832081C45de4041eA",
    },
  };
}

// Iniciar servidor / Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(
    "🚀 Servidor CDP JWT iniciado en puerto / CDP JWT Server started on port:",
    PORT,
  );
  console.log(
    "🌐 Escuchando en todas las interfaces (0.0.0.0) / Listening on all interfaces (0.0.0.0)",
  );
  console.log("📋 Configuración CDP / CDP Configuration:", {
    appId: CDP_CONFIG.appId
      ? "✅ Configurado / Configured"
      : "❌ No configurado / Not configured",
    apiKey: CDP_CONFIG.apiKey
      ? "✅ Configurado / Configured"
      : "❌ No configurado / Not configured",
    privateKey: CDP_CONFIG.privateKey
      ? "✅ Configurado / Configured"
      : "❌ No configurado / Not configured",
  });
  console.log("🌐 Frontend URL:", config.cors.frontendUrl);
  console.log("🔗 Health check: http://localhost:" + PORT + "/api/health");
  console.log("🔗 Health check: http://127.0.0.1:" + PORT + "/api/health");
  console.log("🔗 Health check: http://0.0.0.0:" + PORT + "/api/health");
});
