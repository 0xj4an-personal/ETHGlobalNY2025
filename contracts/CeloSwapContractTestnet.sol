// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title CeloSwapContractTestnet
 * @dev Contrato para testnet que recibe Celo de Coinbase Onramp y hace swap a cUSD (simulando cCOP)
 * @author 0xj4an
 */
contract CeloSwapContractTestnet is Ownable, ReentrancyGuard, Pausable {
    
    // Tokens en Alfajores Testnet
    IERC20 public constant CELO = IERC20(0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9);
    IERC20 public constant CUSD = IERC20(0x874069fA1Eb16d44D622F2E0fA25b6c482d98A93);
    
    // En testnet, simulamos cCOP con cUSD
    IERC20 public constant CCOP_SIMULATED = IERC20(0x874069fA1Eb16d44D622F2E0fA25b6c482d98A93);
    
    // Eventos
    event CeloReceived(address indexed from, uint256 amount);
    event SwapExecuted(address indexed user, uint256 celoAmount, uint256 cCopAmount);
    event CcopSent(address indexed user, uint256 amount);
    event EmergencyWithdraw(address indexed token, uint256 amount);
    
    // Mapeo de usuarios a montos pendientes
    mapping(address => uint256) public pendingSwaps;
    
    // Fee del contrato (0.5%)
    uint256 public constant CONTRACT_FEE = 50; // 0.5% = 50/10000
    uint256 public constant FEE_DENOMINATOR = 10000;
    
    // Constructor
    constructor() Ownable(msg.sender) {
        // En testnet no necesitamos aprobar tokens para Uniswap
    }
    
    /**
     * @dev Función principal que recibe Celo de Coinbase Onramp
     * @param user Dirección del usuario que recibirá cCOP (simulado con cUSD)
     */
    function receiveCeloAndSwap(address user) external payable nonReentrant whenNotPaused {
        require(msg.value > 0, "Amount must be greater than 0");
        require(user != address(0), "Invalid user address");
        
        // Registrar el swap pendiente
        pendingSwaps[user] = msg.value;
        
        emit CeloReceived(msg.sender, msg.value);
        
        // Ejecutar swap automático
        _executeSwap(user, msg.value);
    }
    
    /**
     * @dev Función para que Coinbase Onramp envíe Celo directamente
     * @param user Dirección del usuario que recibirá cCOP
     */
    function onrampToCCOP(address user) external payable nonReentrant whenNotPaused {
        require(msg.value > 0, "Amount must be greater than 0");
        require(user != address(0), "Invalid user address");
        
        // Registrar el swap pendiente
        pendingSwaps[user] = msg.value;
        
        emit CeloReceived(msg.sender, msg.value);
        
        // Ejecutar swap automático
        _executeSwap(user, msg.value);
    }
    
    /**
     * @dev Función interna para ejecutar el swap (simulado en testnet)
     * @param user Usuario que recibirá cCOP
     * @param celoAmount Cantidad de Celo a cambiar
     */
    function _executeSwap(address user, uint256 celoAmount) internal {
        // Calcular fee del contrato
        uint256 feeAmount = (celoAmount * CONTRACT_FEE) / FEE_DENOMINATOR;
        uint256 swapAmount = celoAmount - feeAmount;
        
        // Transferir fee al owner
        if (feeAmount > 0) {
            payable(owner()).transfer(feeAmount);
        }
        
        // En testnet, simulamos el swap
        // En producción, aquí se haría el swap real con Uniswap
        uint256 cCopAmount = _simulateSwap(swapAmount);
        
        // Transferir cUSD (simulando cCOP) al usuario
        require(CUSD.transfer(user, cCopAmount), "Failed to transfer cUSD (simulated cCOP)");
        
        // Limpiar swap pendiente
        delete pendingSwaps[user];
        
        emit SwapExecuted(user, celoAmount, cCopAmount);
        emit CcopSent(user, cCopAmount);
    }
    
    /**
     * @dev Simula el swap de CELO a cCOP (en testnet)
     * @param celoAmount Cantidad de Celo
     * @return cCopAmount Cantidad de cCOP recibida (simulada)
     */
    function _simulateSwap(uint256 celoAmount) internal returns (uint256 cCopAmount) {
        // Simulación simple: 1 CELO = 2 cUSD (aproximado)
        // En producción, esto sería un swap real con Uniswap
        cCopAmount = celoAmount * 2;
        
        // Emitir evento de swap simulado
        emit SwapExecuted(address(this), celoAmount, cCopAmount);
    }
    
    /**
     * @dev Función de emergencia para retirar tokens
     * @param token Dirección del token
     * @param amount Cantidad a retirar
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            // Retirar ETH/Celo
            payable(owner()).transfer(amount);
        } else {
            // Retirar ERC20
            IERC20(token).transfer(owner(), amount);
        }
        
        emit EmergencyWithdraw(token, amount);
    }
    
    /**
     * @dev Pausar el contrato
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Despausar el contrato
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Recibir ETH/Celo automáticamente y ejecutar swap
     */
    receive() external payable {
        // Solo ejecutar si hay Celo enviado
        if (msg.value > 0) {
            // Obtener la dirección del sender
            address sender = msg.sender;
            
            // Ejecutar swap automático para el sender
            _executeSwap(sender, msg.value);
        }
    }
    
    /**
     * @dev Función fallback para recibir Celo con datos
     */
    fallback() external payable {
        // Si hay Celo enviado, ejecutar swap automático
        if (msg.value > 0) {
            address sender = msg.sender;
            _executeSwap(sender, msg.value);
        }
    }
    
    /**
     * @dev Obtener balance del contrato
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Obtener balance de un token específico
     */
    function getTokenBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
    
    /**
     * @dev Función para testing: obtener información del contrato
     */
    function getContractInfo() external view returns (
        uint256 contractBalance,
        uint256 celoBalance,
        uint256 cusdBalance,
        bool isPaused,
        address contractOwner
    ) {
        return (
            address(this).balance,
            CELO.balanceOf(address(this)),
            CUSD.balanceOf(address(this)),
            paused(),
            owner()
        );
    }
}
