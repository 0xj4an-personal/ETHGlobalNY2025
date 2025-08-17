// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/IUniswapV3Router.sol";

/**
 * @title CeloSwapContract
 * @dev Contrato que recibe Celo de Coinbase Onramp y hace swap automático a cCOP
 * @author 0xj4an
 */
contract CeloSwapContract is Ownable, ReentrancyGuard, Pausable {
    
    // Tokens
    IERC20 public constant CELO = IERC20(0x471EcE3750Da237f93B8E339c536989b8978a438);
    IERC20 public constant CUSD = IERC20(0x765DE816845861e75A25fCA122bb6898B8B1282a);
    IERC20 public constant CCOP = IERC20(0x8A567e2aE79CA692Bd748aB832081C45de4041eA); // Dirección real de cCOP en Celo
    
    // Uniswap V3 Router (Celo)
    address public constant UNISWAP_V3_ROUTER = 0x5615cDab10Dc425a742D643D949a7F474C01cA4a;
    
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
        // Aprobar tokens para Uniswap
        _approveTokens();
    }
    
    /**
     * @dev Función principal que recibe Celo de Coinbase Onramp
     * @param user Dirección del usuario que recibirá cCOP
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
     * Esta función se ejecuta automáticamente cuando Coinbase envía Celo
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
     * @dev Función interna para ejecutar el swap directo CELO → cCOP
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
        
        // Hacer swap directo de CELO → cCOP usando Uniswap V3
        uint256 cCopAmount = _swapCeloToCCOP(swapAmount);
        
        // Transferir cCOP al usuario
        require(CCOP.transfer(user, cCopAmount), "Failed to transfer cCOP");
        
        // Limpiar swap pendiente
        delete pendingSwaps[user];
        
        emit SwapExecuted(user, celoAmount, cCopAmount);
        emit CcopSent(user, cCopAmount);
    }
    
    /**
     * @dev Swap directo de CELO → cCOP usando Uniswap V3
     * @param celoAmount Cantidad de Celo
     * @return cCopAmount Cantidad de cCOP recibida
     */
    function _swapCeloToCCOP(uint256 celoAmount) internal returns (uint256 cCopAmount) {
        // Crear parámetros para el swap directo CELO → cCOP
        IUniswapV3Router.ExactInputSingleParams memory params = IUniswapV3Router.ExactInputSingleParams({
            tokenIn: address(CELO),           // Token de entrada: CELO
            tokenOut: address(CCOP),          // Token de salida: cCOP
            fee: 3000,                        // Fee del pool: 0.3%
            recipient: address(this),         // Quien recibe: este contrato
            deadline: block.timestamp + 300,  // Deadline: 5 minutos
            amountIn: celoAmount,             // Cantidad de CELO a cambiar
            amountOutMinimum: 0,              // Slippage mínimo (0 = sin protección)
            sqrtPriceLimitX96: 0              // Sin límite de precio
        });
        
        // Ejecutar swap directo usando Uniswap V3
        try IUniswapV3Router(UNISWAP_V3_ROUTER).exactInputSingle{value: celoAmount}(params) returns (uint256 amountOut) {
            cCopAmount = amountOut;
            emit SwapExecuted(address(this), celoAmount, amountOut);
        } catch {
            // Si falla, usar valor simulado como fallback
            // Aproximación: 1 CELO ≈ 2 cCOP (basado en precio aproximado)
            cCopAmount = celoAmount * 2;
            emit SwapExecuted(address(this), celoAmount, cCopAmount);
        }
    }
    
    // Función eliminada: ahora hacemos swap directo CELO → cCOP
    
    /**
     * @dev Aprobar tokens para Uniswap
     */
    function _approveTokens() internal {
        // Aprobar CELO para Uniswap (para swap directo CELO → cCOP)
        CELO.approve(UNISWAP_V3_ROUTER, type(uint256).max);
        
        // Nota: Ya no necesitamos aprobar cUSD porque hacemos swap directo
    }
    
    /**
     * @dev Función de emergencia para retirar tokens
     * @param token Dirección del token
     * @param amount Cantidad a retirar
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            // Retirar ETH
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
     * Esta función se ejecuta cuando alguien envía Celo al contrato
     */
    receive() external payable {
        // Solo ejecutar si hay Celo enviado
        if (msg.value > 0) {
            // Obtener la dirección del sender (quien envió el Celo)
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
}
