import React from 'react';
import './QuoteDisplay.css';

function QuoteDisplay({ quote, onProceed, onCancel }) {
  if (!quote) return null;

  return (
    <div className="quote-display">
      <div className="quote-header">
        <h3>📊 Quote de Compra cCOP</h3>
        <p>Compra Celo y recibe cCOP automáticamente</p>
      </div>

              <div className="quote-details">
          <div className="quote-row">
            <span>Monto en COP:</span>
            <span className="amount">{quote.sourceAmount.toLocaleString()} {quote.sourceCurrency}</span>
          </div>
          
          <div className="quote-row">
            <span>Equivale a USD:</span>
            <span className="usd-amount">${quote.amountUSD} USD</span>
          </div>
          
          <div className="quote-row">
            <span>Celo que se compra:</span>
            <span className="celo-amount">{quote.celoAmount} CELO</span>
          </div>
          
          <div className="quote-row">
            <span>Precio Celo:</span>
            <span className="price">${quote.celoPriceUSD} USD</span>
          </div>
          
          <div className="quote-row">
            <span>Fee de transacción:</span>
            <span className="fees">{quote.transactionFee} COP</span>
          </div>
          
          <div className="quote-row">
            <span>Fee de red:</span>
            <span className="fees">{quote.networkFee} COP</span>
          </div>
          
          <div className="quote-row total-row">
            <span>Total fees:</span>
            <span className="total-fees">{quote.estimatedFees} COP</span>
          </div>
          
          <div className="quote-row highlight-row">
            <span>🎯 cCOP a recibir:</span>
            <span className="ccop-amount">{parseFloat(quote.destinationAmount).toLocaleString()} cCOP</span>
          </div>
          
          <div className="quote-row">
            <span>Fee de swap (0.3%):</span>
            <span className="swap-fee">{quote.swapFee}</span>
          </div>
          
          <div className="quote-row">
            <span>Red:</span>
            <span className="network">{quote.network.toUpperCase()}</span>
          </div>
          
          <div className="quote-row">
            <span>Expira en:</span>
            <span className="expires">{new Date(quote.expiresAt).toLocaleTimeString()}</span>
          </div>
        </div>

      <div className="quote-actions">
        <button onClick={onCancel} className="cancel-button">
          Cancelar
        </button>
        <button onClick={onProceed} className="proceed-button">
          🚀 Comprar Celo y Recibir cCOP
        </button>
      </div>
    </div>
  );
}

export default QuoteDisplay;
