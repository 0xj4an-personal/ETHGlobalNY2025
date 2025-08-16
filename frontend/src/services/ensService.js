import { ethers } from 'ethers';

class ENSService {
  constructor() {
    // Usar provider público para resolver ENS
    this.provider = new ethers.JsonRpcProvider('https://eth.llamarpc.com');
  }

  // Resolver ENS a dirección Ethereum
  async resolveENS(ensName) {
    try {
      console.log('🔍 Resolviendo ENS:', ensName);
      
      // Verificar si es una dirección válida (no ENS)
      if (ethers.isAddress(ensName)) {
        console.log('✅ Ya es una dirección válida:', ensName);
        return ensName;
      }
      
      // Verificar si termina en .eth
      if (!ensName.endsWith('.eth')) {
        throw new Error('Nombre ENS debe terminar en .eth');
      }
      
      // Resolver ENS
      const address = await this.provider.resolveName(ensName);
      
      if (!address) {
        throw new Error(`No se pudo resolver ENS: ${ensName}`);
      }
      
      console.log('✅ ENS resuelto:', ensName, '→', address);
      return address;
      
    } catch (error) {
      console.error('❌ Error resolviendo ENS:', error);
      throw new Error(`Error resolviendo ENS ${ensName}: ${error.message}`);
    }
  }

  // Validar dirección para blockchain específico
  validateAddressForBlockchain(address, blockchain) {
    try {
      if (!ethers.isAddress(address)) {
        throw new Error('Dirección no válida');
      }
      
      // Para Celo, verificar que sea una dirección Ethereum válida
      if (blockchain === 'celo') {
        // Celo usa el mismo formato que Ethereum
        if (address.length !== 42 || !address.startsWith('0x')) {
          throw new Error('Dirección Celo debe ser de 42 caracteres y empezar con 0x');
        }
        
        // Verificar checksum
        const checksumAddress = ethers.getAddress(address);
        console.log('✅ Dirección Celo válida:', checksumAddress);
        return checksumAddress;
      }
      
      return address;
      
    } catch (error) {
      console.error('❌ Error validando dirección:', error);
      throw new Error(`Dirección inválida para ${blockchain}: ${error.message}`);
    }
  }

  // Resolver y validar dirección completa
  async resolveAndValidateAddress(input, blockchain = 'celo') {
    try {
      console.log('🔍 Resolviendo y validando dirección:', input, 'para', blockchain);
      
      // Resolver ENS si es necesario
      const resolvedAddress = await this.resolveENS(input);
      
      // Validar para blockchain específico
      const validatedAddress = this.validateAddressForBlockchain(resolvedAddress, blockchain);
      
      console.log('✅ Dirección final válida:', validatedAddress);
      return validatedAddress;
      
    } catch (error) {
      console.error('❌ Error en resolución y validación:', error);
      throw error;
    }
  }
}

export default new ENSService();
