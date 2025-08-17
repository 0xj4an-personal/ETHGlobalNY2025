const { ethers } = require("hardhat");
const testnetConfig = require("../contracts/testnet-config");

async function main() {
  console.log("🚀 Iniciando deploy en Celo Alfajores Testnet...");
  console.log("📋 Configuración:", testnetConfig.network.name);

  // Obtener la cuenta deployer
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deployando desde la cuenta:", deployer.address);
  console.log("💰 Balance de la cuenta:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "CELO");

  // Verificar que estamos en la red correcta
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== testnetConfig.network.chainId) {
    throw new Error(`❌ Red incorrecta. Esperado: ${testnetConfig.network.chainId}, Actual: ${network.chainId}`);
  }

  // Paso 1: Deploy del contrato de swap para testnet
  console.log("\n📦 Paso 1: Deployando CeloSwapContractTestnet...");
  const CeloSwapContractTestnet = await ethers.getContractFactory("CeloSwapContractTestnet");
  const celoSwapContract = await CeloSwapContractTestnet.deploy();
  await celoSwapContract.waitForDeployment();
  
  const swapContractAddress = await celoSwapContract.getAddress();
  console.log("✅ CeloSwapContractTestnet deployado en:", swapContractAddress);

  // Paso 2: Deploy del contrato de integración
  console.log("\n📦 Paso 2: Deployando CeloOnrampIntegrationTestnet...");
  const CeloOnrampIntegrationTestnet = await ethers.getContractFactory("CeloOnrampIntegrationTestnet");
  const onrampIntegration = await CeloOnrampIntegrationTestnet.deploy(swapContractAddress);
  await onrampIntegration.waitForDeployment();
  
  const integrationAddress = await onrampIntegration.getAddress();
  console.log("✅ CeloOnrampIntegrationTestnet deployado en:", integrationAddress);

  // Verificar que ambos contratos se deployaron correctamente
  const swapCode = await deployer.provider.getCode(swapContractAddress);
  const integrationCode = await deployer.provider.getCode(integrationAddress);
  
  if (swapCode === "0x") {
    throw new Error("❌ CeloSwapContractTestnet no se deployó correctamente");
  }
  
  if (integrationCode === "0x") {
    throw new Error("❌ CeloOnrampIntegration no se deployó correctamente");
  }

  console.log("🔍 Verificando configuración de los contratos...");
  
  // Verificar constantes del contrato de swap
  const celoToken = await celoSwapContract.CELO();
  const cusdToken = await celoSwapContract.CUSD();
  const cCopSimulated = await celoSwapContract.CCOP_SIMULATED();
  const contractFee = await celoSwapContract.CONTRACT_FEE();
  const feeDenominator = await celoSwapContract.FEE_DENOMINATOR();
  const swapOwner = await celoSwapContract.owner();
  
  // Verificar configuración del contrato de integración
  const integrationOwner = await onrampIntegration.owner();
  const linkedSwapContract = await onrampIntegration.celoSwapContract();
  const isOwnerAuthorized = await onrampIntegration.isOnrampAuthorized(deployer.address);

  console.log("📋 Configuración de los contratos:");
  console.log("\n🔄 CeloSwapContractTestnet:");
  console.log("   CELO Token:", celoToken);
  console.log("   cUSD Token:", cusdToken);
  console.log("   cCOP Simulado:", cCopSimulated);
  console.log("   Contract Fee:", contractFee.toString());
  console.log("   Fee Denominator:", feeDenominator.toString());
  console.log("   Owner:", swapOwner);
  
  console.log("\n🔗 CeloOnrampIntegrationTestnet:");
  console.log("   Owner:", integrationOwner);
  console.log("   Linked Swap Contract:", linkedSwapContract);
  console.log("   Owner Authorized:", isOwnerAuthorized);

  // Verificar que los owners son correctos
  if (swapOwner !== deployer.address) {
    console.warn("⚠️  El owner del CeloSwapContract no coincide con la cuenta deployer");
  }
  
  if (integrationOwner !== deployer.address) {
    console.warn("⚠️  El owner del CeloOnrampIntegration no coincide con la cuenta deployer");
  }

  // Verificar fee del contrato (debe ser 0.5%)
  const expectedFee = 50; // 0.5% = 50/10000
  if (contractFee.toString() !== expectedFee.toString()) {
    console.warn("⚠️  El fee del contrato no es 0.5%");
  }
  
  // Verificar que el contrato de integración está vinculado correctamente
  if (linkedSwapContract !== swapContractAddress) {
    console.warn("⚠️  El contrato de integración no está vinculado correctamente");
  }

  // Verificar que las direcciones de tokens coinciden con la configuración
  if (celoToken !== testnetConfig.tokens.CELO) {
    console.warn("⚠️  La dirección del token CELO no coincide con la configuración");
  }
  
  if (cusdToken !== testnetConfig.tokens.CUSD) {
    console.warn("⚠️  La dirección del token cUSD no coincide con la configuración");
  }

  console.log("\n🎉 Deploy en testnet completado exitosamente!");
  console.log("📝 Para verificar los contratos en CeloScan Alfajores:");
  console.log(`   CeloSwapContractTestnet: ${testnetConfig.network.explorer}/address/${swapContractAddress}`);
  console.log(`   CeloOnrampIntegration: ${testnetConfig.network.explorer}/address/${integrationAddress}`);
  
  // Guardar la información de deploy en un archivo
  const fs = require("fs");
  const deploymentInfo = {
    network: testnetConfig.network.name,
    chainId: testnetConfig.network.chainId,
    contracts: {
      celoSwapContract: {
        address: swapContractAddress,
        name: "CeloSwapContractTestnet",
        description: "Contrato de swap para testnet (simula cCOP con cUSD)"
      },
      celoOnrampIntegration: {
        address: integrationAddress,
        name: "CeloOnrampIntegration",
        description: "Contrato de integración con Coinbase Onramp"
      }
    },
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    integration: {
      onrampContract: integrationAddress,
      swapContract: swapContractAddress
    },
    testnet: {
      tokens: testnetConfig.tokens,
      cdp: testnetConfig.cdp
    }
  };
  
  fs.writeFileSync(
    `deployment-${testnetConfig.network.name}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log(`💾 Información de deploy guardada en: deployment-${testnetConfig.network.name}.json`);
  
  // Mostrar información para configurar Coinbase Onramp
  console.log("\n🔧 Configuración para Coinbase Onramp:");
  console.log("   Contrato de integración:", integrationAddress);
  console.log("   Función a llamar: processOnramp(userAddress)");
  console.log("   Red: Celo Alfajores Testnet");
  console.log("   Tokens: CELO → cUSD (simulando cCOP)");
  
  return {
    swapContractAddress,
    integrationAddress,
    deployer: deployer.address,
    network: testnetConfig.network.name,
    chainId: testnetConfig.network.chainId
  };
}

// Ejecutar el deploy
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error durante el deploy:", error);
    process.exit(1);
  });
