// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/**
 * @title ChainlinkCOPUSDPriceFeed
 * @dev Contrato para obtener precios COP/USD desde Chainlink
 * @dev Contract to get COP/USD prices from Chainlink
 */
contract ChainlinkCOPUSDPriceFeed {
    AggregatorV3Interface public immutable copUsdPriceFeed;
    
    // Eventos para logging / Events for logging
    event PriceUpdated(int256 price, uint256 timestamp);
    event PriceFeedAddressUpdated(address indexed oldAddress, address indexed newAddress);
    
    /**
     * @dev Constructor que establece la dirección del Price Feed de Chainlink
     * @dev Constructor that sets the Chainlink Price Feed address
     * @param _priceFeedAddress Dirección del Price Feed COP/USD de Chainlink / Chainlink COP/USD Price Feed address
     */
    constructor(address _priceFeedAddress) {
        require(_priceFeedAddress != address(0), "Invalid price feed address");
        copUsdPriceFeed = AggregatorV3Interface(_priceFeedAddress);
    }
    
    /**
     * @dev Obtiene el precio más reciente de COP/USD desde Chainlink
     * @dev Gets the latest COP/USD price from Chainlink
     * @return price Precio de COP en USD (con 8 decimales) / COP price in USD (with 8 decimals)
     * @return timestamp Timestamp del precio / Price timestamp
     * @return roundId ID de la ronda del precio / Price round ID
     */
    function getLatestPrice() public view returns (
        int256 price,
        uint256 timestamp,
        uint80 roundId
    ) {
        (
            uint80 _roundId,
            int256 _price,
            uint256 _startedAt,
            uint256 timestamp,
            uint80 _answeredInRound
        ) = copUsdPriceFeed.latestRoundData();
        
        require(_price > 0, "Invalid price");
        require(_answeredInRound >= _roundId, "Stale price");
        
        return (_price, timestamp, _roundId);
    }
    
    /**
     * @dev Obtiene el precio de COP/USD con validaciones
     * @dev Gets COP/USD price with validations
     * @return price Precio de COP en USD / COP price in USD
     */
    function getCOPUSDPrice() public view returns (int256 price) {
        (price, , ) = getLatestPrice();
        return price;
    }
    
    /**
     * @dev Convierte cantidad de COP a USD usando el precio de Chainlink
     * @dev Converts COP amount to USD using Chainlink price
     * @param copAmount Cantidad en COP (con 18 decimales) / Amount in COP (with 18 decimals)
     * @return usdAmount Cantidad equivalente en USD / Equivalent amount in USD
     */
    function convertCOPtoUSD(uint256 copAmount) public view returns (uint256 usdAmount) {
        int256 price = getCOPUSDPrice();
        // Chainlink devuelve precio con 8 decimales, COP tiene 18 decimales
        // Chainlink returns price with 8 decimals, COP has 18 decimals
        usdAmount = (copAmount * uint256(price)) / 1e26; // 18 + 8 = 26 decimales
        return usdAmount;
    }
    
    /**
     * @dev Convierte cantidad de USD a COP usando el precio de Chainlink
     * @dev Converts USD amount to COP using Chainlink price
     * @param usdAmount Cantidad en USD (con 18 decimales) / Amount in USD (with 18 decimals)
     * @return copAmount Cantidad equivalente en COP / Equivalent amount in COP
     */
    function convertUSDtoCOP(uint256 usdAmount) public view returns (uint256 copAmount) {
        int256 price = getCOPUSDPrice();
        // Chainlink devuelve precio con 8 decimales, USD tiene 18 decimales
        // Chainlink returns price with 8 decimals, USD has 18 decimals
        copAmount = (usdAmount * 1e26) / uint256(price); // 18 + 8 = 26 decimales
        return copAmount;
    }
    
    /**
     * @dev Obtiene información del Price Feed
     * @dev Gets Price Feed information
     * @return decimals Número de decimales del precio / Number of price decimals
     * @return description Descripción del Price Feed / Price Feed description
     * @return version Versión del Price Feed / Price Feed version
     */
    function getPriceFeedInfo() public view returns (
        uint8 decimals,
        string memory description,
        uint256 version
    ) {
        decimals = copUsdPriceFeed.decimals();
        description = copUsdPriceFeed.description();
        version = copUsdPriceFeed.version();
        return (decimals, description, version);
    }
}
