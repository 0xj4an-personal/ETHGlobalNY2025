# 🚀 Celo Onramp App

Aplicación simple para onramp de Celo usando el CDP Onramp SDK de Coinbase.

## 🎯 Funcionalidades

- ✅ **CDP Onramp SDK integrado** - Generación de URLs de onramp
- ✅ **Quote en tiempo real** - Previsualización de costos y fees
- ✅ **Compra directa en COP** - Sin conversiones confusas
- ✅ **Botones de montos prefijados** - 100K, 250K, 500K, 1M COP
- ✅ **Conversión automática** COP → Celo → cCOP
- ✅ **Flujo visual claro** - Explicación paso a paso del proceso
- ✅ **Interfaz simple e intuitiva** con flujo de usuario optimizado
- ✅ **Soporte para direcciones de wallet** (preparado para ENS)
- ✅ **Diseño responsive** y moderno

## 🚀 Instalación

1. **Instalar dependencias del frontend:**
```bash
npm run setup
```

2. **Configurar y ejecutar el backend (NUEVO):**
```bash
# Instalar dependencias del backend
cd backend
npm install

# Configurar variables de entorno
cp env.example .env
# Editar .env con tus credenciales reales de CDP

# Iniciar el backend
npm run dev
```

3. **En otra terminal, ejecutar el frontend:**
```bash
cd ../
npm run dev
```

4. **Abrir en el navegador:**
```
http://localhost:3000
```

## 🏗️ Estructura del Proyecto

```
├── frontend/          # React app con Vite
│   ├── src/          # Código fuente
│   ├── package.json  # Dependencias del frontend
│   └── vite.config.js
├── backend/           # Node.js server para JWT CDP
│   ├── server.js     # Servidor principal
│   ├── package.json  # Dependencias del backend
│   └── env.example   # Variables de entorno
├── package.json       # Scripts del proyecto
└── README.md
```

## 🔧 Próximos Pasos

- [x] ✅ Integrar CDP Onramp SDK (con App ID real)
- [x] ✅ Generar URLs de onramp reales para Coinbase
- [x] ✅ Quote detallado con fees realistas
- [x] ✅ Parámetros de API corregidos (addresses, assets, sessionToken)
- [x] ✅ Flujo visual claro del proceso
- [x] ✅ **API Key de CDP configurada**
- [x] ✅ **Backend Node.js para JWT reales** (NUEVO)
- [ ] 🔄 **Probar backend con credenciales reales**
- [ ] Implementar swap automático Celo → cCOP
- [ ] Añadir soporte ENS
- [ ] Backend para manejo de transacciones
- [ ] Integración con APIs de Quote de CDP

## 📚 Tecnologías

- **Frontend:** React 18, Vite, CSS3 con gradientes
- **Backend:** Node.js, Express, JWT, CORS
- **CDP:** Coinbase Developer Platform Onramp APIs
- **Blockchain:** Celo, cCOP stablecoin

## 🔐 Backend JWT Generator

El backend resuelve el problema de "Invalid sessionToken" generando JWT tokens reales usando tu private key de CDP:

- **Puerto:** 3001
- **Endpoints:** `/api/generate-jwt`, `/api/generate-session-token`
- **Autenticación:** JWT firmado con private key de CDP
- **Integración:** Frontend llama al backend para tokens válidos
