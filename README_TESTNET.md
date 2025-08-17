# 🧪 Celo Onramp App - Testnet Setup

## 🎯 **Objetivo**
Configurar y probar el sistema completo de Celo Onramp en **Celo Alfajores Testnet** siguiendo las mejores prácticas de [Coinbase CDP](https://github.com/coinbase/onramp-demo-application/blob/51733031e49ed4b505291ee7acbdbee429dceb3c/app/utils/sessionTokenApi.ts).

---

## 🚀 **Deploy Rápido en Testnet**

### **1. Instalar dependencias:**
```bash
npm run contracts:install
```

### **2. Compilar contratos de testnet:**
```bash
npx hardhat compile --config hardhat.config.testnet.js
```

### **3. Configurar variables de entorno:**
Crear archivo `.env` en la raíz:
```bash
# Tu private key para deploy
PRIVATE_KEY=tu_private_key_aqui

# CDP ya configurado
CDP_APP_ID=5e724356-f66f-45d2-accf-c0b562fd2edd
CDP_API_KEY=38ee86f8-1e30-42a1-8125-bed547762b21
CDP_PRIVATE_KEY=r5qehxv90t95wO1Xm/Q6G8V/cK8E3tgt8x/udLuzma6joijqcUUCMGU1OMi9++0IWzld/i4+y3aJZor+7KI8Cg==
```

### **4. Deploy en Alfajores:**
```bash
npm run contracts:deploy:alfajores
```

---

## 🔧 **Arquitectura del Sistema**

### **Contratos Deployados:**
1. **`CeloSwapContractTestnet`**: Contrato principal que recibe CELO y hace swap simulado a cUSD
2. **`CeloOnrampIntegrationTestnet`**: Contrato de integración que Coinbase Onramp llama

### **Flujo de Transacción:**
```
Usuario → Coinbase Onramp → CeloOnrampIntegration → CeloSwapContract → Swap Simulado → cUSD → Usuario
```

### **Características:**
- ✅ **Swap automático** cuando se recibe CELO
- ✅ **Fee del contrato**: 0.5%
- ✅ **Simulación de cCOP** usando cUSD (disponible en testnet)
- ✅ **Seguridad**: ReentrancyGuard, Pausable, Ownable
- ✅ **Eventos** para tracking completo

---

## 🌿 **Configuración de Celo Alfajores**

### **Red:**
- **Chain ID**: 44787
- **RPC URL**: `https://alfajores-forno.celo-testnet.org`
- **Explorer**: `https://alfajores.celoscan.io`
- **Faucet**: `https://faucet.celo.org/alfajores`

### **Tokens:**
- **CELO**: `0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9`
- **cUSD**: `0x874069fA1Eb16d44D622F2E0fA25b6c482d98A93`
- **cCOP**: Simulado con cUSD (no disponible en testnet)

---

## 🔗 **Integración con Coinbase Onramp**

### **Configuración CDP:**
```javascript
{
  country: 'US',           // País para testnet
  paymentCurrency: 'USD',  // Moneda de pago
  paymentMethod: 'CARD',   // Método de pago
  purchaseCurrency: 'CGLD', // Celo
  purchaseNetwork: 'celo'   // Red Celo
}
```

### **Contrato a Configurar:**
- **Dirección**: Del `CeloOnrampIntegrationTestnet` deployado
- **Función**: `processOnramp(userAddress)`
- **Parámetros**: Dirección del usuario que recibirá cUSD

---

## 🧪 **Testing del Sistema**

### **1. Verificar Deploy:**
```bash
# Verificar que los contratos están en la blockchain
npx hardhat console --network alfajores
```

### **2. Probar Swap Simulado:**
```javascript
// En Hardhat console
const contract = await ethers.getContractAt("CeloSwapContractTestnet", contractAddress);

// Simular recepción de Celo
await contract.receiveCeloAndSwap(userAddress, { value: ethers.parseEther("1.0") });
```

### **3. Verificar Balances:**
```javascript
// Balance del contrato
const contractBalance = await contract.getContractBalance();

// Balance de tokens
const celoBalance = await contract.getTokenBalance(celoTokenAddress);
const cusdBalance = await contract.getTokenBalance(cusdTokenAddress);
```

---

## 📊 **Monitoreo y Debugging**

### **Eventos Importantes:**
- `CeloReceived`: CELO recibido
- `SwapExecuted`: Swap completado
- `CcopSent`: cUSD (simulando cCOP) enviado
- `OnrampAuthorized`: Onramp autorizado

### **Funciones de Verificación:**
```javascript
// Información del contrato
const info = await contract.getContractInfo();

// Estado del contrato
const isPaused = await contract.paused();
const owner = await contract.owner();
```

---

## 🚨 **Solución de Problemas**

### **Error de Compilación:**
```bash
# Limpiar cache
npx hardhat clean
npx hardhat compile --config hardhat.config.testnet.js
```

### **Error de Red:**
```bash
# Verificar que estás en Alfajores
npx hardhat console --network alfajores
```

### **Error de Deploy:**
- Verificar balance de la cuenta
- Verificar private key en `.env`
- Verificar configuración de red

---

## 🔄 **Próximos Pasos**

### **1. Después de Testing Exitoso:**
- ✅ Verificar funcionalidad completa
- ✅ Documentar resultados
- ✅ Preparar para mainnet

### **2. Deploy en Mainnet:**
```bash
npm run contracts:deploy:celo
```

### **3. Configuración de Producción:**
- Actualizar direcciones de tokens reales
- Configurar Uniswap V3 real
- Configurar Coinbase Onramp para producción

---

## 📚 **Recursos Adicionales**

- [Celo Alfajores Faucet](https://faucet.celo.org/alfajores)
- [CeloScan Alfajores](https://alfajores.celoscan.io)
- [Celo Documentation](https://docs.celo.org/)
- [Coinbase CDP Documentation](https://docs.cdp.coinbase.com/)
- [Coinbase Onramp Demo](https://github.com/coinbase/onramp-demo-application)

---

## 🎉 **¡Listo para Testing!**

Con esta configuración, puedes probar todo el sistema en testnet antes de ir a producción. ¡Es la forma más segura de verificar que todo funciona correctamente!

### **Comandos Rápidos:**
```bash
# Compilar
npx hardhat compile --config hardhat.config.testnet.js

# Deploy
npm run contracts:deploy:alfajores

# Verificar
npx hardhat console --network alfajores
```
