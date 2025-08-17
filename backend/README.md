# 🚀 Backend CDP JWT Generator

Backend Node.js para generar JWT tokens reales para la autenticación de Coinbase CDP Onramp.

## 🎯 **Propósito**

Este backend resuelve el problema de "Invalid sessionToken" generando JWT tokens reales usando tu private key de CDP.

## 📋 **Requisitos**

- Node.js 16+
- npm o yarn
- Credenciales de CDP (App ID, API Key, Private Key)

## 🚀 **Instalación**

1. **Instalar dependencias:**

```bash
npm install
```

2. **Configurar variables de entorno:**

```bash
cp env.example .env
```

3. **Editar `.env` con tus credenciales reales:**

```env
CDP_APP_ID=tu_app_id_aqui
CDP_API_KEY=tu_api_key_aqui
CDP_PRIVATE_KEY=tu_private_key_aqui
PORT=3001
FRONTEND_URL=http://localhost:3000
```

## 🔧 **Uso**

### **Desarrollo:**

```bash
npm run dev
```

### **Producción:**

```bash
npm start
```

## 🌐 **Endpoints**

### **POST /api/generate-jwt**

Genera un JWT token para una dirección de wallet específica.

**Request:**

```json
{
  "walletAddress": "0x1234..."
}
```

**Response:**

```json
{
  "success": true,
  "jwt": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": "1 hour",
  "walletAddress": "0x1234..."
}
```

### **POST /api/generate-session-token**

Genera un session token de CDP usando JWT.

**Request:**

```json
{
  "walletAddress": "0x1234...",
  "amount": 100000
}
```

**Response:**

```json
{
  "success": true,
  "sessionToken": "session_token_aqui",
  "jwt": "eyJhbGciOiJIUzI1NiIs...",
  "walletAddress": "0x1234...",
  "amount": 100000
}
```

### **GET /api/health**

Health check del servidor.

## 🔐 **Cómo Funciona**

1. **JWT Generation:** Usa tu private key para firmar JWT tokens
2. **CDP Authentication:** Envía JWT como Bearer token a CDP API
3. **Session Token:** Obtiene session token válido de CDP
4. **Frontend Integration:** El frontend usa estos tokens para onramp

## 🛠️ **Troubleshooting**

### **Error 401 Unauthorized:**

- Verifica que las credenciales en `.env` sean correctas
- Asegúrate de que el private key esté en base64 válido

### **Error de CORS:**

- Verifica que `FRONTEND_URL` en `.env` sea correcta
- El frontend debe estar en `http://localhost:3000`

### **Error de Private Key:**

- La private key debe estar en base64
- Si tienes problemas, puedes regenerar las credenciales en CDP

## 🔗 **Integración con Frontend**

El frontend debe actualizarse para usar este backend en lugar de generar JWT localmente.

## 📚 **Documentación CDP**

- [CDP Session Token Authentication](https://docs.cdp.coinbase.com/onramp-&-offramp/session-token-authentication)
- [CDP API Reference](https://docs.cdp.coinbase.com/api-reference/rest-api/onramp-offramp/create-session-token)
