# 🚀 CDP Production Setup Guide

## ⚠️ Estado Actual
La aplicación está usando un **token de ejemplo** que NO es válido para producción. Necesitas configurar la integración real con CDP.

## 🔑 Pasos para Producción

### 1. Obtener CDP Secret API Key

1. Ve a [CDP Portal](https://portal.cdp.coinbase.com/)
2. Selecciona tu proyecto con App ID: `5e724356-f66f-45d2-accf-c0b562fd2edd`
3. Ve a **API Keys** → **Secret API Keys**
4. Crea una nueva **Secret API Key** (NO Client API Key)
5. Configura IP allowlist para seguridad
6. Descarga y guarda la API key

### 2. Configurar JWT Authentication

Según la [documentación oficial](https://docs.cdp.coinbase.com/onramp-&-offramp/session-token-authentication), necesitas:

```bash
# Generar JWT Bearer token
curl -X POST 'https://api.developer.coinbase.com/onramp/v1/token' \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "addresses": [
      {
        "address": "0x4315d134aCd3221a02dD380ADE3aF39Ce219037c",
        "blockchains": ["celo"]
      }
    ],
    "assets": ["CELO"]
  }'
```

### 3. Actualizar el Servicio

Reemplaza la función `generateSessionToken()` en `cdpService.js`:

```javascript
async generateSessionToken() {
  try {
    const response = await fetch('https://api.developer.coinbase.com/onramp/v1/token', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.REACT_APP_CDP_JWT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        addresses: [
          {
            address: this.walletAddress,
            blockchains: ["celo"]
          }
        ],
        assets: ["CELO"]
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error('Error generating session token:', error);
    throw new Error('No se pudo generar el session token real');
  }
}
```

### 4. Variables de Entorno

Crea un archivo `.env`:

```env
REACT_APP_CDP_APP_ID=5e724356-f66f-45d2-accf-c0b562fd2edd
REACT_APP_CDP_JWT_TOKEN=tu-jwt-token-aqui
REACT_APP_CDP_SECRET_KEY=tu-secret-api-key-aqui
```

## 🧪 Testing

### Con Token Real:
1. Configura las variables de entorno
2. La app generará session tokens válidos
3. Las URLs de onramp funcionarán correctamente

### Con Token de Ejemplo (Actual):
1. Verás warnings en la consola
2. Las URLs generarán errores de "Invalid sessionToken"
3. No podrás completar transacciones reales

## 📚 Recursos

- [Session Token Authentication](https://docs.cdp.coinbase.com/onramp-&-offramp/session-token-authentication)
- [CDP Portal](https://portal.cdp.coinbase.com/)
- [CDP Discord](https://discord.gg/cdp) para soporte

## 🚨 Importante

**NO uses esta app en producción** hasta que configures la integración real con CDP. Los tokens de ejemplo solo sirven para desarrollo y testing.
