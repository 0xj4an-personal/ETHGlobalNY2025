// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./CeloSwapContractTestnet.sol";

/**
 * @title CeloOnrampIntegrationTestnet
 * @dev Contrato de integración para testnet que se integra con Coinbase Onramp
 * @author 0xj4an
 */
contract CeloOnrampIntegrationTestnet is Ownable, ReentrancyGuard, Pausable {
    
    // Contrato principal de swap para testnet
    address payable public celoSwapContract;
    
    // Mapeo de usuarios autorizados (Coinbase Onramp)
    mapping(address => bool) public authorizedOnramp;
    
    // Eventos
    event OnrampAuthorized(address indexed onrampAddress);
    event OnrampDeauthorized(address indexed onrampAddress);
    event CeloReceivedFromOnramp(address indexed user, uint256 amount, address indexed onramp);
    event SwapInitiated(address indexed user, uint256 celoAmount);
    
    // Modificadores
    modifier onlyAuthorizedOnramp() {
        require(authorizedOnramp[msg.sender], "Only authorized onramp can call this function");
        _;
    }
    
    // Constructor
    constructor(address _celoSwapContract) Ownable(msg.sender) {
        celoSwapContract = payable(_celoSwapContract);
        // El deployer es el owner
        authorizedOnramp[msg.sender] = true;
    }
    
    /**
     * @dev Función principal que Coinbase Onramp llama para enviar Celo
     * @param user Dirección del usuario que recibirá cCOP (simulado con cUSD)
     */
    function processOnramp(address user) external payable onlyAuthorizedOnramp nonReentrant whenNotPaused {
        require(msg.value > 0, "Amount must be greater than 0");
        require(user != address(0), "Invalid user address");
        
        emit CeloReceivedFromOnramp(user, msg.value, msg.sender);
        
        // Transferir Celo al contrato de swap
        (bool success, ) = celoSwapContract.call{value: msg.value}(
            abi.encodeWithSelector(CeloSwapContractTestnet.onrampToCCOP.selector, user)
        );
        
        require(success, "Failed to transfer Celo to swap contract");
        
        emit SwapInitiated(user, msg.value);
    }
    
    /**
     * @dev Función para procesar onramp con datos adicionales
     * @param user Dirección del usuario que recibirá cCOP
     * @param metadata Metadatos adicionales (opcional)
     */
    function processOnrampWithMetadata(address user, string memory metadata) external payable onlyAuthorizedOnramp nonReentrant whenNotPaused {
        require(msg.value > 0, "Amount must be greater than 0");
        require(user != address(0), "Invalid user address");
        
        emit CeloReceivedFromOnramp(user, msg.value, msg.sender);
        
        // Transferir Celo al contrato de swap
        (bool success, ) = celoSwapContract.call{value: msg.value}(
            abi.encodeWithSelector(CeloSwapContractTestnet.onrampToCCOP.selector, user)
        );
        
        require(success, "Failed to transfer Celo to swap contract");
        
        emit SwapInitiated(user, msg.value);
    }
    
    /**
     * @dev Función para recibir Celo directamente (fallback)
     * Solo funciona si el sender es un onramp autorizado
     */
    receive() external payable {
        // Solo procesar si el sender está autorizado
        if (authorizedOnramp[msg.sender] && msg.value > 0) {
            // En este caso, necesitamos que el onramp especifique el usuario
            // Por eso usamos processOnramp en su lugar
            revert("Use processOnramp function instead of direct transfer");
        }
    }
    
    /**
     * @dev Autorizar una dirección de onramp
     * @param onrampAddress Dirección del onramp a autorizar
     */
    function authorizeOnramp(address onrampAddress) external onlyOwner {
        require(onrampAddress != address(0), "Invalid onramp address");
        authorizedOnramp[onrampAddress] = true;
        emit OnrampAuthorized(onrampAddress);
    }
    
    /**
     * @dev Desautorizar una dirección de onramp
     * @param onrampAddress Dirección del onramp a desautorizar
     */
    function deauthorizeOnramp(address onrampAddress) external onlyOwner {
        require(onrampAddress != address(0), "Invalid onramp address");
        authorizedOnramp[onrampAddress] = false;
        emit OnrampDeauthorized(onrampAddress);
    }
    
    /**
     * @dev Verificar si una dirección está autorizada
     * @param onrampAddress Dirección del onramp a verificar
     * @return bool True si está autorizada
     */
    function isOnrampAuthorized(address onrampAddress) external view returns (bool) {
        return authorizedOnramp[onrampAddress];
    }
    
    /**
     * @dev Obtener información del contrato vinculado
     * @return address Dirección del contrato de swap
     * @return bool Si el contrato está pausado
     */
    function getContractInfo() external view returns (address, bool) {
        return (celoSwapContract, paused());
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
    }
    
    /**
     * @dev Obtener balance del contrato
     * @return uint256 Balance en ETH/Celo
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Obtener balance de un token específico
     * @param token Dirección del token
     * @return uint256 Balance del token
     */
    function getTokenBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
    
    /**
     * @dev Función para testing: simular autorización de Coinbase Onramp
     * @param onrampAddress Dirección a autorizar
     */
    function simulateOnrampAuthorization(address onrampAddress) external onlyOwner {
        // Solo para testing en testnet
        authorizedOnramp[onrampAddress] = true;
        emit OnrampAuthorized(onrampAddress);
    }
    
    /**
     * @dev Función para testing: procesar onramp desde cualquier dirección autorizada
     * @param user Dirección del usuario
     * @param onrampAddress Dirección del onramp (debe estar autorizada)
     */
    function testProcessOnramp(address user, address onrampAddress) external payable {
        require(authorizedOnramp[onrampAddress], "Onramp not authorized");
        require(msg.value > 0, "Amount must be greater than 0");
        require(user != address(0), "Invalid user address");
        
        emit CeloReceivedFromOnramp(user, msg.value, onrampAddress);
        
        // Transferir Celo al contrato de swap
        (bool success, ) = celoSwapContract.call{value: msg.value}(
            abi.encodeWithSelector(CeloSwapContractTestnet.onrampToCCOP.selector, user)
        );
        
        require(success, "Failed to transfer Celo to swap contract");
        
        emit SwapInitiated(user, msg.value);
    }
}
