# Direcciones de Contratos y Tokens - Celo Onramp App

## 🌿 **Red Celo Mainnet**

### **Tokens:**
- **CELO**: `0x471EcE3750Da237f93B8E339c536989b8978a438`
- **cUSD**: `0x765DE816845861e75A25fCA122bb6898B8B1282a`
- **cCOP**: `0x8A567e2aE79CA692Bd748aB832081C45de4041eA` ✅ **ACTUALIZADO**

### **Uniswap V3:**
- **Router**: `0x5615CDAb10dc425a742d643d949a7F474C01ca4a`
- **Factory**: `0xAfE208a311B21f13EF87E33A900EfA55F2d8D3d5`

### **Contratos (Pendientes de Deploy):**
- **CeloSwapContract**: `0x0000000000000000000000000000000000000000` (Pendiente)
- **CeloOnrampIntegration**: `0x0000000000000000000000000000000000000000` (Pendiente)

---

## 🧪 **Red Celo Alfajores Testnet**

### **Tokens:**
- **CELO**: `0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9`
- **cUSD**: `0x874069Fa1Eb16D44d622F2e0fA25b6c482d98A93`
- **cCOP**: `0x0000000000000000000000000000000000000000` (No disponible en testnet)

---

## 🔗 **Pools de Liquidez Requeridos**

### **Para que funcione el swap directo:**
- **Pool CELO/cCOP** en Uniswap V3 con fee 0.3%
- **Liquidez suficiente** para manejar los volúmenes de onramp

### **Pools alternativos (si no existe CELO/cCOP):**
- **CELO/cUSD** → **cUSD/cCOP** (dos swaps)

---

## 📝 **Notas Importantes**

1. **cCOP es un token real** en Celo mainnet
2. **Dirección verificada**: `0x8A567e2aE79CA692Bd748aB832081C45de4041eA`
3. **El contrato ahora hace swap directo** CELO → cCOP
4. **Más eficiente** que el método anterior de dos swaps

---

## 🚀 **Próximos Pasos**

1. **Verificar** que existe el pool CELO/cCOP en Uniswap V3
2. **Deployar** los contratos en Celo mainnet
3. **Configurar** Coinbase Onramp para usar el contrato
4. **Probar** el flujo completo de onramp → swap → cCOP
