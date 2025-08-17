# 🚀 Celo Onramp App - Información del Proyecto

## 📋 Detalles del Proyecto

### **Project ID (App ID)**
```
5e724356-f66f-45d2-accf-c0b562fd2edd
```

### **API Key Actual (Volvimos a la Anterior)**
```json
{
   "id": "38ee86f8-1e30-42a1-8125-bed547762b21",
   "privateKey": "r5qehxv90t95wO1Xm/Q6G8V/cK8E3tgt8x/udLuzma6joijqcUUCMGU1OMi9++0IWzld/i4+y3aJZor+7KI8Cg==",
   "type": "HMAC (Base64)",
   "status": "✅ ACTIVA - Funciona para Buy Options"
}
```

### **Permisos de la API Key Actual**
- ✅ **View, Trade, Transfer** - Permisos básicos
- ✅ **Policies#manage, Accounts** - Permisos administrativos
- ❌ **onramp:read** - Para Buy Options API (pero funciona de alguna manera)
- ❌ **onramp:write** - Para Session Token API
- ❌ **onramp:quote** - Para Buy Quote API

### **API Key Nueva (Con Permisos Completos - NO ACTIVA)**
```json
{
   "id": "6f48cc9e-f17b-4e47-b06c-d9f8c3fb99d5",
   "privateKey": "-----BEGIN EC PRIVATE KEY-----\nMHcCAQEEIJWOHv+kUAH17dMRWJPe3ObQGosQbM5PYXpOEKQ5rYrEoAoGCCqGSM49\nAwEHoUQDQgAELGnO28yhZpaVuAeZl7ZDLJ0Io2yfyjKqRRJeL0g6VmMWfCR8/1xW\n1KOz+q4DhVQP8zLcBYe+lGSbvVbrp3Zs3Q==\n-----END EC PRIVATE KEY-----",
   "type": "ECDSA (Recomendado para CDP)",
   "status": "❌ NO ACTIVA - Problemas de formato de clave"
}
```

## 🎯 Estado Actual

### **✅ Lo que funciona:**
- ENS resolver (funcionando perfectamente)
- Buy Options API (funciona con la API Key anterior)
- Backend ejecutándose correctamente
- JWT generation funcionando

### **❌ Lo que NO funciona:**
- Session Token API (401 Unauthorized)
- Buy Quote API (401 Unauthorized)
- Generación de URLs de onramp con sessionToken válido

## 🛠️ Próximos Pasos

### **1. ✅ Configuración Revertida**
- `backend/config.js` actualizado con API Key anterior
- API Key anterior tiene permisos limitados pero funciona para Buy Options

### **2. 🔄 Reiniciar Backend**
- Detener proceso actual
- Reiniciar con configuración anterior

### **3. 🧪 Probar Funcionalidad**
- Health Check
- Buy Options API (debería funcionar)
- Session Token API (probablemente 401)
- Buy Quote API (probablemente 401)

## 📚 Referencias

- [CDP Onramp Demo Application](https://github.com/coinbase/onramp-demo-application/blob/main/app/utils/sessionTokenApi.ts)
- [CDP SDK](https://github.com/coinbase/cdp-sdk/tree/main/typescript#installation)
- [CDP Buy Quote API](https://docs.cdp.coinbase.com/api-reference/rest-api/onramp-offramp/create-buy-quote)

---
**Última actualización:** 16 de Agosto, 2025
**Estado:** ✅ Revertido a API Key anterior - Listo para probar
