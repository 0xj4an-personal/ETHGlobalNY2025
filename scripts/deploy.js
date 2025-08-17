const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Iniciando deploy de los contratos de Celo Onramp...");

  // Obtener la cuenta deployer
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deployando desde la cuenta:", deployer.address);
  console.log("💰 Balance de la cuenta:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "CELO");

  // Paso 1: Deploy del contrato principal de swap
  console.log("\n📦 Paso 1: Deployando CeloSwapContract...");
  const CeloSwapContract = await ethers.getContractFactory("CeloSwapContract");
  const celoSwapContract = await CeloSwapContract.deploy();
  await celoSwapContract.waitForDeployment();
  
  const swapContractAddress = await celoSwapContract.getAddress();
  console.log("✅ CeloSwapContract deployado en:", swapContractAddress);

  // Paso 2: Deploy del contrato de integración
  console.log("\n📦 Paso 2: Deployando CeloOnrampIntegration...");
  const CeloOnrampIntegration = await ethers.getContractFactory("CeloOnrampIntegration");
  const onrampIntegration = await CeloOnrampIntegration.deploy(swapContractAddress);
  await onrampIntegration.waitForDeployment();
  
  const integrationAddress = await onrampIntegration.getAddress();
  console.log("✅ CeloOnrampIntegration deployado en:", integrationAddress);

  // Verificar que ambos contratos se deployaron correctamente
  const swapCode = await deployer.provider.getCode(swapContractAddress);
  const integrationCode = await deployer.provider.getCode(integrationAddress);
  
  if (swapCode === "0x") {
    throw new Error("❌ CeloSwapContract no se deployó correctamente");
  }
  
  if (integrationCode === "0x") {
    throw new Error("❌ CeloOnrampIntegration no se deployó correctamente");
  }

  console.log("🔍 Verificando configuración de los contratos...");
  
  // Verificar constantes del contrato de swap
  const celoToken = await celoSwapContract.CELO();
  const cusdToken = await celoSwapContract.CUSD();
  const cCopToken = await celoSwapContract.CCOP();
  const uniswapRouter = await celoSwapContract.UNISWAP_V3_ROUTER();
  const contractFee = await celoSwapContract.CONTRACT_FEE();
  const feeDenominator = await celoSwapContract.FEE_DENOMINATOR();
  const swapOwner = await celoSwapContract.owner();
  
  // Verificar configuración del contrato de integración
  const integrationOwner = await onrampIntegration.owner();
  const linkedSwapContract = await onrampIntegration.celoSwapContract();
  const isOwnerAuthorized = await onrampIntegration.isOnrampAuthorized(deployer.address);

  console.log("📋 Configuración de los contratos:");
  console.log("\n🔄 CeloSwapContract:");
  console.log("   CELO Token:", celoToken);
  console.log("   cUSD Token:", cusdToken);
  console.log("   cCOP Token:", cCopToken);
  console.log("   Uniswap V3 Router:", uniswapRouter);
  console.log("   Contract Fee:", contractFee.toString());
  console.log("   Fee Denominator:", feeDenominator.toString());
  console.log("   Owner:", swapOwner);
  
  console.log("\n🔗 CeloOnrampIntegration:");
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

  console.log("\n🎉 Deploy completado exitosamente!");
  console.log("📝 Para verificar los contratos en CeloScan:");
  console.log(`   CeloSwapContract: https://celoscan.io/address/${swapContractAddress}`);
  console.log(`   CeloOnrampIntegration: https://celoscan.io/address/${integrationAddress}`);
  
  // Guardar la información de deploy en un archivo
  const fs = require("fs");
  const deploymentInfo = {
    network: hre.network.name,
    contracts: {
      celoSwapContract: {
        address: swapContractAddress,
        name: "CeloSwapContract",
        description: "Contrato principal que ejecuta swaps CELO → cCOP"
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
    }
  };
  
  fs.writeFileSync(
    `deployment-${hre.network.name}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log(`💾 Información de deploy guardada en: deployment-${hre.network.name}.json`);
  
  return {
    swapContractAddress,
    integrationAddress,
    deployer: deployer.address,
    network: hre.network.name
  };
}

// Ejecutar el deploy
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error durante el deploy:", error);
    process.exit(1);
  });
