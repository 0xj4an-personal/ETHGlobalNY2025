import { ethers } from 'ethers';

class ENSService {
  constructor() {
    // Usar providers que funcionen en el navegador sin CORS / Use providers that work in browser without CORS
    this.providers = [
      'https://ethereum.publicnode.com',
      'https://rpc.builder0x69.io',
      'https://rpc.ankr.com/eth_goerli' // Goerli testnet como fallback / Goerli testnet as fallback
    ];
    this.currentProviderIndex = 0;
    this.provider = new ethers.JsonRpcProvider(this.providers[this.currentProviderIndex]);
  }

  // Cambiar provider si falla / Switch provider if it fails
  async switchProvider() {
    this.currentProviderIndex = (this.currentProviderIndex + 1) % this.providers.length;
    const newProviderUrl = this.providers[this.currentProviderIndex];
    console.log('🔄 Cambiando provider a / Switching provider to:', newProviderUrl);
    this.provider = new ethers.JsonRpcProvider(newProviderUrl);
  }

  // Resolver ENS a dirección Ethereum con retry / Resolve ENS to Ethereum address with retry
  async resolveENS(ensName) {
    let lastError;
    
    for (let attempt = 0; attempt < this.providers.length; attempt++) {
      try {
        console.log('🔍 Resolviendo ENS / Resolving ENS:', ensName, 'con provider / with provider:', this.providers[this.currentProviderIndex]);
        
        // Verificar si es una dirección válida (no ENS) / Check if it's a valid address (not ENS)
        if (ethers.isAddress(ensName)) {
          console.log('✅ Ya es una dirección válida / Already a valid address:', ensName);
          return ensName;
        }
        
        // Verificar si termina en .eth / Check if it ends with .eth
        if (!ensName.endsWith('.eth')) {
          throw new Error('Nombre ENS debe terminar en .eth / ENS name must end with .eth');
        }
        
        // Resolver ENS / Resolve ENS
        const address = await this.provider.resolveName(ensName);
        
        if (!address) {
          throw new Error(`No se pudo resolver ENS / Could not resolve ENS: ${ensName}`);
        }
        
        console.log('✅ ENS resuelto / ENS resolved:', ensName, '→', address);
        return address;
        
      } catch (error) {
        console.warn(`⚠️ Intento ${attempt + 1} falló con provider ${this.providers[this.currentProviderIndex]} / Attempt ${attempt + 1} failed with provider ${this.providers[this.currentProviderIndex]}:`, error.message);
        lastError = error;
        
        // Cambiar provider para el siguiente intento / Switch provider for next attempt
        if (attempt < this.providers.length - 1) {
          await this.switchProvider();
        }
      }
    }
    
    // Si todos los providers fallaron / If all providers failed
    console.error('❌ Todos los providers fallaron resolviendo ENS / All providers failed resolving ENS:', ensName);
    throw new Error(`Error resolviendo ENS / Error resolving ENS ${ensName}: ${lastError.message}`);
  }

  // Validar dirección para blockchain específico / Validate address for specific blockchain
  validateAddressForBlockchain(address, blockchain) {
    try {
      if (!ethers.isAddress(address)) {
        throw new Error('Dirección no válida / Invalid address');
      }
      
      // Para Celo, verificar que sea una dirección Ethereum válida / For Celo, verify it's a valid Ethereum address
      if (blockchain === 'celo') {
        // Celo usa el mismo formato que Ethereum / Celo uses the same format as Ethereum
        if (address.length !== 42 || !address.startsWith('0x')) {
          throw new Error('Dirección Celo debe ser de 42 caracteres y empezar con 0x / Celo address must be 42 characters and start with 0x');
        }
        
        // Verificar checksum / Verify checksum
        const checksumAddress = ethers.getAddress(address);
        console.log('✅ Dirección Celo válida / Valid Celo address:', checksumAddress);
        return checksumAddress;
      }
      
      return address;
      
    } catch (error) {
      console.error('❌ Error validando dirección / Error validating address:', error);
      throw new Error(`Dirección inválida para ${blockchain} / Invalid address for ${blockchain}: ${error.message}`);
    }
  }

  // Resolver y validar dirección completa / Resolve and validate complete address
  async resolveAndValidateAddress(input, blockchain = 'celo') {
    try {
      console.log('🔍 Resolviendo y validando dirección / Resolving and validating address:', input, 'para / for', blockchain);
      
      // Resolver ENS si es necesario / Resolve ENS if necessary
      const resolvedAddress = await this.resolveENS(input);
      
      // Validar para blockchain específico / Validate for specific blockchain
      const validatedAddress = this.validateAddressForBlockchain(resolvedAddress, blockchain);
      
      console.log('✅ Dirección final válida / Final valid address:', validatedAddress);
      return validatedAddress;
      
    } catch (error) {
      console.error('❌ Error en resolución y validación / Error in resolution and validation:', error);
      throw error;
    }
  }
}

export default new ENSService();
