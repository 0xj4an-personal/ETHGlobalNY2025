# 🚀 Celo Onramp App

Una aplicación web que permite a los usuarios realizar operaciones de onramp usando el **Coinbase CDP Onramp SDK**, específicamente diseñada para comprar **Celo** con **COP (Pesos Colombianos)** y recibir **cCOP (Pesos Digitales)** en su wallet.

## 🎯 Funcionalidad Principal

### **Flujo de Usuario:**
1. **Input**: Usuario ingresa cantidad en COP (100,000, 250,000, 500,000, 1,000,000)
2. **Wallet**: Usuario ingresa dirección de wallet (soporta ENS resolver)
3. **Onramp**: Compra Celo con tarjeta de crédito
4. **Swap Automático**: Celo se convierte automáticamente a cCOP
5. **Resultado**: Usuario recibe cCOP en su wallet

### **Tecnologías Utilizadas:**
- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Blockchain**: Celo Network
- **APIs**: Coinbase CDP Onramp APIs
- **ENS**: Resolución de nombres .eth

## 🚨 Estado Actual: **EN ESPERA DE NUEVA API KEY**

### **✅ Lo que funciona:**
- ENS resolver (funcionando perfectamente)
- Buy Options API (solo lectura básica)
- Frontend completo y funcional
- Backend configurado correctamente

### **❌ Lo que NO funciona:**
- Session Token API (401 Unauthorized)
- Buy Quote API (401 Unauthorized)
- Generación de URLs de onramp con sessionToken válido

### **🔑 Problema Identificado:**
La API Key actual tiene permisos limitados:
```
✅ View, Trade, Transfer, Policies#manage, Accounts
❌ onramp:read, onramp:write, onramp:quote (FALTANTES)
```

## 🛠️ Instalación y Configuración

### **Prerrequisitos:**
- Node.js 18+
- npm o yarn
- Cuenta en Coinbase Developer Portal

### **1. Clonar el repositorio:**
```bash
git clone <repository-url>
cd ETHGlobalNY2025
```

### **2. Instalar dependencias:**
```bash
# Instalar dependencias del proyecto principal
npm install

# Instalar dependencias del backend
cd backend && npm install

# Instalar dependencias del frontend
cd ../frontend && npm install
```

### **3. Configurar variables de entorno:**
```bash
# En backend/config.js (actualizar con nueva API Key)
cdp: {
  appId: '5e724356-f66f-45d2-accf-c0b562fd2edd',
  apiKey: 'NUEVA_API_KEY_ID',           // ← ACTUALIZAR
  privateKey: 'NUEVA_PRIVATE_KEY'       // ← ACTUALIZAR
}
```

### **4. Ejecutar la aplicación:**
```bash
# Terminal 1: Backend
cd backend && npm start

# Terminal 2: Frontend  
cd frontend && npm run dev
```

## 🔧 Configuración de API Key

### **Permisos Requeridos:**
Para que la app funcione completamente, necesitas una API Key con:

```
✅ onramp:read    - Para Buy Options API
✅ onramp:write   - Para Session Token API  
✅ onramp:quote   - Para Buy Quote API
✅ View, Trade, Transfer (mantener existentes)
```

### **Cómo Crear Nueva API Key:**
1. Ir al [Portal de Desarrolladores de Coinbase](https://developer.coinbase.com/)
2. Seleccionar tu proyecto: `5e724356-f66f-45d2-accf-c0b562fd2edd`
3. Crear nueva API Key con permisos completos
4. Actualizar `backend/config.js` con la nueva información

## 📁 Estructura del Proyecto

```
ETHGlobalNY2025/
├── frontend/                 # Aplicación React
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   ├── services/        # Servicios (CDP, ENS)
│   │   └── App.jsx         # Componente principal
│   └── package.json
├── backend/                  # Servidor Node.js
│   ├── server.js            # Servidor Express
│   ├── config.js            # Configuración CDP
│   └── package.json
├── PROJECT_INFO.md          # Información detallada del proyecto
└── README.md               # Este archivo
```

## 🧪 Testing

### **APIs Disponibles:**
- `GET /api/health` - Health check
- `GET /api/buy-options` - Buy Options API (funciona)
- `POST /api/generate-session-token` - Session Token API (401)
- `POST /api/generate-buy-quote` - Buy Quote API (401)

### **Frontend:**
- Abrir http://localhost:3001
- Probar ENS resolver con `0xj4an.eth`
- Probar generación de URL de onramp

## 🚀 Próximos Pasos

### **Inmediato:**
1. **Crear nueva API Key** con permisos completos
2. **Actualizar configuración** del backend
3. **Probar funcionalidad completa**

### **Futuro:**
- Implementar swap automático Celo → cCOP
- Integrar Uniswap V3 en Celo
- Mejorar UI/UX
- Agregar más opciones de pago

## 📚 Documentación y Referencias

- [CDP Onramp Demo Application](https://github.com/coinbase/onramp-demo-application/blob/main/app/utils/sessionTokenApi.ts)
- [CDP SDK](https://github.com/coinbase/cdp-sdk/tree/main/typescript#installation)
- [CDP Buy Quote API](https://docs.cdp.coinbase.com/api-reference/rest-api/onramp-offramp/create-buy-quote)
- [CDP Onramp Overview](https://docs.cdp.coinbase.com/onramp-&-offramp/onramp-overview)

## 🤝 Contribuir

1. Fork el proyecto
2. Crear rama para feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

---

**Desarrollado para ETHGlobal NY 2025** 🎉

**Estado:** En espera de nueva API Key con permisos completos
**Última actualización:** 16 de Agosto, 2025
