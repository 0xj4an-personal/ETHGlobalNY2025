// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PriceOracle
 * @dev Oracle de precios para conversiones COP/USD usando Chainlink
 * @author 0xj4an
 */
contract PriceOracle is Ownable {
    
    // Chainlink Price Feeds
    AggregatorV3Interface public immutable usdUsdFeed; // USD/USD (sempre 1)
    AggregatorV3Interface public immutable copUsdFeed; // COP/USD desde Chainlink
    
    // Eventos
    event PriceUpdated(string symbol, uint256 price, uint8 decimals);
    event OracleAddressUpdated(string symbol, address newOracle);
    
    // Constructor
    constructor(address _copUsdOracle) Ownable(msg.sender) {
        // USD/USD siempre es 1:1
        usdUsdFeed = AggregatorV3Interface(0x0000000000000000000000000000000000000000);
        
        // COP/USD Oracle de Chainlink
        copUsdFeed = AggregatorV3Interface(_copUsdOracle);
    }
    
    /**
     * @dev Obtener precio actual de COP/USD
     * @return price Precio con 8 decimales
     * @return decimals Número de decimales
     */
    function getCOPUSDPrice() public view returns (uint256 price, uint8 decimals) {
        (, int256 rawPrice, , , ) = copUsdFeed.latestRoundData();
        require(rawPrice > 0, "Invalid price");
        
        price = uint256(rawPrice);
        decimals = copUsdFeed.decimals();
        
        return (price, decimals);
    }
    
    /**
     * @dev Convertir COP a USD usando precio actual
     * @param copAmount Cantidad en COP (con 2 decimales)
     * @return usdAmount Cantidad en USD (con 2 decimales)
     */
    function convertCOPtoUSD(uint256 copAmount) public view returns (uint256 usdAmount) {
        (uint256 price, uint8 decimals) = getCOPUSDPrice();
        
        // COP tiene 2 decimales, USD tiene 2 decimales
        // Chainlink price tiene 8 decimales
        // Formula: (COP * 10^2) * (ChainlinkPrice * 10^8) / 10^8 = COP * Price
        usdAmount = (copAmount * price) / (10 ** decimals);
        
        return usdAmount;
    }
    
    /**
     * @dev Convertir USD a COP usando precio actual
     * @param usdAmount Cantidad en USD (con 2 decimales)
     * @return copAmount Cantidad en COP (con 2 decimales)
     */
    function convertUSDtoCOP(uint256 usdAmount) public view returns (uint256 copAmount) {
        (uint256 price, uint8 decimals) = getCOPUSDPrice();
        
        // Formula: (USD * 10^2) * 10^8 / (ChainlinkPrice * 10^8) = USD / Price
        copAmount = (usdAmount * (10 ** decimals)) / price;
        
        return copAmount;
    }
    
    /**
     * @dev Obtener precio formateado para mostrar
     * @return priceString Precio formateado como string
     */
    function getFormattedCOPUSDPrice() public view returns (string memory priceString) {
        (uint256 price, uint8 decimals) = getCOPUSDPrice();
        
        // Convertir a string con formato apropiado
        if (decimals == 8) {
            uint256 integerPart = price / 100000000;
            uint256 decimalPart = price % 100000000;
            
            if (decimalPart == 0) {
                return string(abi.encodePacked(uint2str(integerPart), ".00"));
            } else {
                // Redondear a 2 decimales
                decimalPart = (decimalPart * 100) / 100000000;
                return string(abi.encodePacked(uint2str(integerPart), ".", uint2str(decimalPart)));
            }
        }
        
        return uint2str(price);
    }
    
    /**
     * @dev Función auxiliar para convertir uint a string
     */
    function uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        
        uint256 j = _i;
        uint256 length;
        
        while (j != 0) {
            length++;
            j /= 10;
        }
        
        bytes memory bstr = new bytes(length);
        uint256 k = length;
        
        while (_i != 0) {
            k -= 1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        
        return string(bstr);
    }
    
    /**
     * @dev Actualizar dirección del oracle COP/USD
     * @param newOracle Nueva dirección del oracle
     */
    function updateCOPUSDOracle(address newOracle) external onlyOwner {
        require(newOracle != address(0), "Invalid oracle address");
        // Note: This would require making copUsdFeed mutable, which is not ideal
        // For production, consider using a proxy pattern or factory pattern
    }
}
