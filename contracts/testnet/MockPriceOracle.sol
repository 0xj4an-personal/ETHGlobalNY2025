// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockPriceOracle
 * @dev Oracle de precios simulado para testnet (COP/USD)
 * @author 0xj4an
 */
contract MockPriceOracle is Ownable {
    
    // Precio simulado COP/USD (1 USD = ~4000 COP)
    uint256 public constant MOCK_COP_USD_PRICE = 4000000000; // 4000.00000000 con 8 decimales
    uint8 public constant DECIMALS = 8;
    
    // Eventos
    event PriceUpdated(uint256 newPrice);
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Obtener precio simulado de COP/USD
     * @return price Precio con 8 decimales
     * @return decimals Número de decimales
     */
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        return (
            1, // roundId
            int256(MOCK_COP_USD_PRICE), // answer
            block.timestamp, // startedAt
            block.timestamp, // updatedAt
            1 // answeredInRound
        );
    }
    
    /**
     * @dev Obtener decimales del precio
     */
    function decimals() external pure returns (uint8) {
        return DECIMALS;
    }
    
    /**
     * @dev Obtener descripción del feed
     */
    function description() external pure returns (string memory) {
        return "COP/USD Mock Price Feed";
    }
    
    /**
     * @dev Obtener versión del feed
     */
    function version() external pure returns (uint256) {
        return 1;
    }
    
    /**
     * @dev Actualizar precio simulado (solo para testing)
     * @param newPrice Nuevo precio con 8 decimales
     */
    function updateMockPrice(uint256 newPrice) external onlyOwner {
        // Esta función solo existe para testing
        // En producción, el precio vendría de Chainlink
        emit PriceUpdated(newPrice);
    }
    
    /**
     * @dev Obtener precio actual
     */
    function getPrice() external view returns (uint256) {
        return MOCK_COP_USD_PRICE;
    }
}
