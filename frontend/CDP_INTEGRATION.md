# CDP Integration Guide

## Session Token Authentication

Para usar la aplicación en producción, necesitas obtener un `sessionToken` real de la API de CDP.

### 1. Obtener Credenciales

1. Ve a [CDP Portal](https://portal.cdp.coinbase.com/)
2. Crea una nueva aplicación o usa tu App ID existente: `5e724356-f66f-45d2-accf-c0b562fd2edd`
3. Obtén tu API Key y Secret

### 2. Generar Session Token

```bash
curl -X POST https://api.coinbase.com/v2/onramp/session-token \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "appId": "5e724356-f66f-45d2-accf-c0b562fd2edd",
    "clientId": "your-client-id"
  }'
```

### 3. Actualizar el Servicio

Reemplaza la función `generateSessionToken()` en `cdpService.js`:

```javascript
async generateSessionToken() {
  try {
    const response = await fetch('https://api.coinbase.com/v2/onramp/session-token', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.REACT_APP_CDP_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        appId: this.appId,
        clientId: process.env.REACT_APP_CDP_CLIENT_ID
      })
    });
    
    const data = await response.json();
    return data.sessionToken;
  } catch (error) {
    console.error('Error generating session token:', error);
    throw new Error('No se pudo generar el session token');
  }
}
```

### 4. Variables de Entorno

Crea un archivo `.env`:

```env
REACT_APP_CDP_APP_ID=5e724356-f66f-45d2-accf-c0b562fd2edd
REACT_APP_CDP_API_KEY=your-api-key-here
REACT_APP_CDP_CLIENT_ID=your-client-id-here
```

## Parámetros de URL Actualizados

La nueva implementación usa los parámetros correctos:

- ✅ `addresses` en lugar de `destinationWallets`
- ✅ `assets` en lugar de `blockchains`
- ✅ `sessionToken` requerido para autenticación

## Testing

1. Prueba con montos pequeños primero
2. Verifica que el sessionToken se genere correctamente
3. Confirma que la URL de onramp funcione sin errores
