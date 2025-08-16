# 🔐 CDP JWT Authentication Guide

## ⚠️ Problema Identificado

La aplicación está fallando porque **necesita autenticación JWT real** para la API de CDP, no solo el API key.

## 🔑 Autenticación JWT Requerida

Según la [documentación oficial de CDP](https://docs.cdp.coinbase.com/onramp-&-offramp/session-token-authentication), necesitas:

### 1. JWT Bearer Token
- **NO** solo el API key
- **SÍ** un JWT token firmado con tu private key
- **SÍ** headers específicos de autenticación

### 2. Estructura del JWT
```json
{
  "iss": "0761b732-f913-4923-9d08-0387a137de76", // Tu API Key
  "sub": "5e724356-f66f-45d2-accf-c0b562fd2edd", // Tu App ID
  "aud": "https://api.developer.coinbase.com",
  "exp": 1234567890, // Timestamp de expiración
  "iat": 1234567890  // Timestamp de emisión
}
```

### 3. Estructura del Payload para Session Token
Según la [documentación oficial](https://docs.cdp.coinbase.com/api-reference/rest-api/onramp-offramp/create-session-token):

```json
{
  "addresses": [
    {
      "address": "0x...",
      "blockchains": ["celo"]
    }
  ],
  "assets": ["CELO"],
  "destinationWallets": [
    {
      "address": "0x...",
      "assets": ["CELO"],
      "blockchains": ["celo"],
      "supportedNetworks": ["celo"]
    }
  ]
}
```

### 3. Firma del JWT
El JWT debe ser firmado usando tu **private key**:
```
c1Cdgly3sXPdb1XjalNSoZVZdDruSlKuUsT430xUx80IRdJtEd3vOUgDVjDTKmepVsjimvIqx+7n7bSmv1253g==
```

### 4. Endpoint de la API
**URL:** `https://api.developer.coinbase.com/onramp/v1/token`  
**Método:** `POST`  
**Headers requeridos:**
- `Authorization: Bearer <JWT_TOKEN>`
- `Content-Type: application/json`

**Respuesta exitosa (200):**
```json
{
  "channelId": "<string>",
  "token": "<string>"
}
```

## 🚀 Solución Recomendada

### Opción 1: Backend Node.js (Recomendado)
```javascript
const jwt = require('jsonwebtoken');

function generateCDPJWT() {
  const payload = {
    iss: '0761b732-f913-4923-9d08-0387a137de76',
    sub: '5e724356-f66f-45d2-accf-c0b562fd2edd',
    aud: 'https://api.developer.coinbase.com',
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000)
  };
  
  const privateKey = 'c1Cdgly3sXPdb1XjalNSoZVZdDruSlKuUsT430xUx80IRdJtEd3vOUgDVjDTKmepVsjimvIqx+7n7bSmv1253g==';
  
  return jwt.sign(payload, privateKey, { algorithm: 'HS256' });
}
```

### Opción 2: Servicio Externo
Usar un servicio como:
- [JWT.io](https://jwt.io/) para generar tokens de prueba
- Backend propio para generar tokens en tiempo real

## 🧪 Testing Inmediato

Para probar AHORA, puedes:

1. **Generar un JWT en jwt.io** con tu payload
2. **Usar ese token** en la aplicación
3. **Verificar** que funcione la API de CDP

### Comando cURL para Testing
```bash
curl --request POST \
  --url https://api.developer.coinbase.com/onramp/v1/token \
  --header 'Authorization: Bearer TU_JWT_TOKEN_AQUI' \
  --header 'Content-Type: application/json' \
  --data '{
  "addresses": [
    {
      "address": "0x1234567890123456789012345678901234567890",
      "blockchains": ["celo"]
    }
  ],
  "assets": ["CELO"],
  "destinationWallets": [
    {
      "address": "0x1234567890123456789012345678901234567890",
      "assets": ["CELO"],
      "blockchains": ["celo"],
      "supportedNetworks": ["celo"]
    }
  ]
}'
```

## 📋 Pasos para Implementar

1. **Crear backend Node.js** con autenticación JWT
2. **Implementar endpoint** `/api/cdp/jwt`
3. **Frontend llama** a tu backend para obtener JWT
4. **Frontend usa JWT** para llamar a la API de CDP

## 🚨 Estado Actual

- ✅ **API Key configurada**
- ✅ **App ID configurado**
- ❌ **JWT Authentication faltante**
- ❌ **Session tokens inválidos**

## 🔧 Próximo Paso Crítico

**Implementar autenticación JWT real** o usar un servicio externo para generar tokens válidos.
