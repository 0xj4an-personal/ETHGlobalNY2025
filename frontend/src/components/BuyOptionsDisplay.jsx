import React, { useState, useEffect } from 'react';
import cdpService from '../services/cdpService';
import './BuyOptionsDisplay.css';

const BuyOptionsDisplay = () => {
  const [buyOptions, setBuyOptions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const fetchBuyOptions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const options = await cdpService.getBuyOptions('CO', 'celo');
      setBuyOptions(options);
      console.log('✅ Buy Options cargados:', options);
    } catch (err) {
      setError(err.message);
      console.error('❌ Error cargando Buy Options:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Cargar Buy Options automáticamente al montar el componente
    fetchBuyOptions();
  }, []);

  const handleRefresh = () => {
    fetchBuyOptions();
  };

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  if (loading) {
    return (
      <div className="buy-options-container">
        <div className="buy-options-header">
          <h3>🔍 Opciones de Compra Disponibles</h3>
          <button onClick={handleRefresh} className="refresh-btn" disabled>
            🔄 Cargando...
          </button>
        </div>
        <div className="loading-spinner">⏳ Cargando opciones de compra...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="buy-options-container">
        <div className="buy-options-header">
          <h3>🔍 Opciones de Compra Disponibles</h3>
          <button onClick={handleRefresh} className="refresh-btn">
            🔄 Reintentar
          </button>
        </div>
        <div className="error-message">
          ❌ Error: {error}
        </div>
      </div>
    );
  }

  if (!buyOptions || !buyOptions.data) {
    return (
      <div className="buy-options-container">
        <div className="buy-options-header">
          <h3>🔍 Opciones de Compra Disponibles</h3>
          <button onClick={handleRefresh} className="refresh-btn">
            🔄 Reintentar
          </button>
        </div>
        <div className="no-data">📭 No hay datos disponibles</div>
      </div>
    );
  }

  const { data } = buyOptions;

  return (
    <div className="buy-options-container">
      <div className="buy-options-header">
        <h3>🔍 Opciones de Compra Disponibles</h3>
        <button onClick={handleRefresh} className="refresh-btn">
          🔄 Actualizar
        </button>
      </div>
      
      <div className="buy-options-content">
        <div className="country-info">
          <span className="flag">🇨🇴</span>
          <strong>Colombia (CO)</strong> - Red: <strong>Celo</strong>
        </div>

        {/* Payment Currencies */}
        <div className="section">
          <h4>💳 Monedas de Pago</h4>
          {data.payment_currencies && data.payment_currencies.length > 0 ? (
            <div className="currencies-grid">
              {data.payment_currencies.map((currency, index) => (
                <div key={index} className="currency-item">
                  <span className="currency-symbol">{currency.symbol}</span>
                  <span className="currency-name">{currency.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-payment-methods">
              ⚠️ No hay métodos de pago disponibles para Colombia en este momento
            </div>
          )}
        </div>

        {/* Purchase Currencies */}
        <div className="section">
          <h4>🪙 Monedas de Compra</h4>
          {data.purchase_currencies && data.purchase_currencies.length > 0 ? (
            <div className="currencies-grid">
              {data.purchase_currencies.map((currency, index) => (
                <div key={index} className="currency-item purchase">
                  <div className="currency-header">
                    <img 
                      src={currency.icon_url} 
                      alt={currency.name} 
                      className="currency-icon"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <div className="currency-info">
                      <span className="currency-symbol">{currency.symbol}</span>
                      <span className="currency-name">{currency.name}</span>
                    </div>
                  </div>
                  
                  {expanded && currency.networks && (
                    <div className="networks-info">
                      <h5>🌐 Redes Disponibles:</h5>
                      {currency.networks.map((network, netIndex) => (
                        <div key={netIndex} className="network-item">
                          <div className="network-header">
                            <span className="network-name">{network.display_name}</span>
                            <span className="network-chain">Chain ID: {network.chain_id}</span>
                          </div>
                          <div className="network-details">
                            <span className="contract-address">
                              📍 {network.contract_address}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-purchase-currencies">
              ❌ No hay monedas de compra disponibles
            </div>
          )}
        </div>

        {/* Expand/Collapse Button */}
        <button onClick={toggleExpanded} className="expand-btn">
          {expanded ? '📁 Ocultar Detalles' : '📂 Ver Detalles'}
        </button>

        {/* API Info */}
        <div className="api-info">
          <details>
            <summary>🔧 Información Técnica</summary>
            <div className="api-details">
              <p><strong>JWT Status:</strong> ✅ Generado exitosamente</p>
              <p><strong>API Endpoint:</strong> /onramp/v1/buy/options</p>
              <p><strong>Método:</strong> GET</p>
              <p><strong>País:</strong> CO (Colombia)</p>
              <p><strong>Red:</strong> celo</p>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};

export default BuyOptionsDisplay;
