# 🧪 Configuración para Celo Alfajores Testnet

## 🎯 **Objetivo**
Configurar y probar el sistema completo de Celo Onramp en testnet antes de ir a mainnet.

## 🌿 **Red: Celo Alfajores Testnet**
- **Chain ID**: 44787
- **RPC URL**: `https://alfajores-forno.celo-testnet.org`
- **Explorer**: `https://alfajores.celoscan.io`
- **Faucet**: `https://faucet.celo.org/alfajores`

---

## 📋 **Prerrequisitos**

### **1. Instalar dependencias:**
```bash
npm run contracts:install
```

### **2. Configurar variables de entorno:**
Crear archivo `.env` en la raíz del proyecto:
```bash
# Hardhat Configuration
PRIVATE_KEY=tu_private_key_aqui

# CDP Configuration (ya configurado)
CDP_APP_ID=5e724356-f66f-45d2-accf-c0b562fd2edd
CDP_API_KEY=38ee86f8-1e30-42a1-8125-bed547762b21
CDP_PRIVATE_KEY=r5qehxv90t95wO1Xm/Q6G8V/cK8E3tgt8x/udLuzma6joijqcUUCMGU1OMi9++0IJZor+7KI8Cg==

# Celo Alfajores Testnet
CELO_ALFAJORES_RPC=https://alfajores-forno.celo-testnet.org
```

---

## 🚀 **Deploy en Testnet**

### **1. Compilar contratos:**
```bash
npm run contracts:compile
```

### **2. Deploy en Alfajores:**
```bash
npm run contracts:deploy:alfajores
```

### **3. Verificar deploy:**
- Los contratos se guardan en `deployment-alfajores.json`
- Verificar en [CeloScan Alfajores](https://alfajores.celoscan.io)

---

## 🔧 **Configuración de Coinbase Onramp**

### **1. Información del contrato:**
- **Contrato de integración**: Dirección del `CeloOnrampIntegration`
- **Función**: `processOnramp(userAddress)`
- **Red**: Celo Alfajores Testnet
- **Tokens**: CELO → cUSD (simulando cCOP)

### **2. Parámetros para CDP:**
```javascript
{
  country: 'US',           // País para testnet
  paymentCurrency: 'USD',  // Moneda de pago
  paymentMethod: 'CARD',   // Método de pago
  purchaseCurrency: 'CGLD', // Celo
  purchaseNetwork: 'celo'   // Red Celo
}
```

---

## 🧪 **Testing del Sistema**

### **1. Probar contrato directamente:**
```javascript
// En Hardhat console o script de test
const contract = await ethers.getContractAt("CeloSwapContractTestnet", contractAddress);

// Simular recepción de Celo
await contract.receiveCeloAndSwap(userAddress, { value: ethers.parseEther("1.0") });
```

### **2. Verificar balances:**
```javascript
// Balance del contrato
const contractBalance = await contract.getContractBalance();

// Balance de tokens
const celoBalance = await contract.getTokenBalance(celoTokenAddress);
const cusdBalance = await contract.getTokenBalance(cusdTokenAddress);
```

### **3. Verificar eventos:**
```javascript
// Eventos emitidos
const events = await contract.queryFilter("SwapExecuted");
console.log("Swaps ejecutados:", events);
```

---

## 🔍 **Verificación de Funcionalidad**

### **1. Flujo completo:**
```
Usuario → Coinbase Onramp → Contrato → Swap Simulado → cUSD → Usuario
```

### **2. Puntos de verificación:**
- ✅ Contrato recibe Celo
- ✅ Calcula fee correctamente (0.5%)
- ✅ Ejecuta swap simulado
- ✅ Transfiere cUSD al usuario
- ✅ Emite eventos correctos
- ✅ Limpia swaps pendientes

### **3. Casos de error:**
- ❌ Monto cero
- ❌ Dirección de usuario inválida
- ❌ Contrato pausado
- ❌ Reentrancy attacks

---

## 📊 **Monitoreo y Debugging**

### **1. Logs del contrato:**
```javascript
// Ver información del contrato
const info = await contract.getContractInfo();
console.log("Info del contrato:", info);
```

### **2. Eventos importantes:**
- `CeloReceived`: Celo recibido
- `SwapExecuted`: Swap completado
- `CcopSent`: cCOP (simulado) enviado
- `EmergencyWithdraw`: Retiro de emergencia

### **3. Estado del contrato:**
- `paused()`: Si está pausado
- `owner()`: Dirección del owner
- `pendingSwaps(user)`: Swaps pendientes por usuario

---

## 🚨 **Solución de Problemas**

### **1. Error de red:**
```bash
# Verificar que estás en Alfajores
npx hardhat console --network alfajores
```

### **2. Error de compilación:**
```bash
# Limpiar cache
npx hardhat clean
npm run contracts:compile
```

### **3. Error de deploy:**
```bash
# Verificar balance de la cuenta
# Verificar configuración de red
# Verificar private key
```

---

## 🔄 **Próximos Pasos**

### **1. Después de testing exitoso:**
- ✅ Verificar funcionalidad completa
- ✅ Documentar resultados
- ✅ Preparar para mainnet

### **2. Deploy en mainnet:**
```bash
npm run contracts:deploy:celo
```

### **3. Configuración de producción:**
- Actualizar direcciones de tokens reales
- Configurar Uniswap V3 real
- Configurar Coinbase Onramp para producción

---

## 📚 **Recursos Adicionales**

- [Celo Alfajores Faucet](https://faucet.celo.org/alfajores)
- [CeloScan Alfajores](https://alfajores.celoscan.io)
- [Celo Documentation](https://docs.celo.org/)
- [Coinbase CDP Documentation](https://docs.cdp.coinbase.com/)

---

## 🎉 **¡Listo para Testing!**

Con esta configuración, puedes probar todo el sistema en testnet antes de ir a producción. ¡Es la forma más segura de verificar que todo funciona correctamente!
