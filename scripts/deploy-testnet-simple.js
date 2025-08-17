const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Iniciando deploy en Celo Alfajores Testnet...");

  // Obtener la cuenta deployer
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deployando desde la cuenta:", deployer.address);
  console.log("💰 Balance de la cuenta:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "CELO");

  // Verificar que estamos en la red correcta
  const network = await ethers.provider.getNetwork();
  console.log("🌐 Red actual:", network.chainId);
  
  if (network.chainId !== 44787) {
    console.warn("⚠️  No estás en Alfajores Testnet (Chain ID: 44787)");
    console.warn("   Ejecuta: npx hardhat run scripts/deploy-testnet-simple.js --network alfajores");
  }

  // Paso 1: Deploy del contrato de swap para testnet
  console.log("\n📦 Paso 1: Deployando CeloSwapContractTestnet...");
  const CeloSwapContractTestnet = await ethers.getContractFactory("contracts/testnet/CeloSwapContractTestnet.sol:CeloSwapContractTestnet");
  const celoSwapContract = await CeloSwapContractTestnet.deploy();
  await celoSwapContract.waitForDeployment();
  
  const swapContractAddress = await celoSwapContract.getAddress();
  console.log("✅ CeloSwapContractTestnet deployado en:", swapContractAddress);

  // Paso 2: Deploy del contrato de integración
  console.log("\n📦 Paso 2: Deployando CeloOnrampIntegrationTestnet...");
  const CeloOnrampIntegrationTestnet = await ethers.getContractFactory("contracts/testnet/CeloOnrampIntegrationTestnet.sol:CeloOnrampIntegrationTestnet");
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
    throw new Error("❌ CeloOnrampIntegrationTestnet no se deployó correctamente");
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

  console.log("\n🎉 Deploy en testnet completado exitosamente!");
  console.log("📝 Para verificar los contratos en CeloScan Alfajores:");
  console.log(`   CeloSwapContractTestnet: https://alfajores.celoscan.io/address/${swapContractAddress}`);
  console.log(`   CeloOnrampIntegrationTestnet: https://alfajores.celoscan.io/address/${integrationAddress}`);
  
  // Guardar la información de deploy en un archivo
  const fs = require("fs");
  const deploymentInfo = {
    network: "alfajores",
    chainId: 44787,
    contracts: {
      celoSwapContract: {
        address: swapContractAddress,
        name: "CeloSwapContractTestnet",
        description: "Contrato de swap para testnet (simula cCOP con cUSD)"
      },
      celoOnrampIntegration: {
        address: integrationAddress,
        name: "CeloOnrampIntegrationTestnet",
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
      tokens: {
        CELO: "0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9",
        CUSD: "0x874069fA1Eb16d44D622F2E0fA25b6c482d98A93",
        CCOP_SIMULATED: "0x874069fA1Eb16d44D622F2E0fA25b6c482d98A93"
      },
      cdp: {
        appId: "5e724356-f66f-45d2-accf-c0b562fd2edd",
        apiKey: "38ee86f8-1e30-42a1-8125-bed547762b21",
        country: "US",
        paymentCurrency: "USD",
        paymentMethod: "CARD"
      }
    }
  };
  
  fs.writeFileSync(
    "deployment-alfajores.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("💾 Información de deploy guardada en: deployment-alfajores.json");
  
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
    network: "alfajores",
    chainId: 44787
  };
}

// Ejecutar el deploy
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error durante el deploy:", error);
    process.exit(1);
  });
