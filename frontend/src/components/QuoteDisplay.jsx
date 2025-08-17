import React from 'react';
import './QuoteDisplay.css';
import { formatCOP, formatCELO, formatCCOP } from '../utils/formatters';

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
            <span className="amount">{formatCOP(parseFloat(quote.monto_cop), 0)}</span>
          </div>
          
          <div className="quote-row">
            <span>Celo que se compra:</span>
            <span className="celo-amount">{formatCELO(parseFloat(quote.celo_a_comprar))}</span>
          </div>
          
          <div className="quote-row">
            <span>Fee de transacción:</span>
            <span className="fees">{formatCOP(parseFloat(quote.fee_transaccion), 2)}</span>
          </div>
          
          <div className="quote-row">
            <span>Fee de red:</span>
            <span className="fees">{formatCOP(parseFloat(quote.fee_red), 2)}</span>
          </div>
          
          <div className="quote-row total-row">
            <span>Total fees:</span>
            <span className="total-fees">{formatCOP(parseFloat(quote.total_fees), 2)}</span>
          </div>
          
          <div className="quote-row highlight-row">
            <span>🎯 cCOP a recibir:</span>
            <span className="ccop-amount">{formatCCOP(parseFloat(quote.realCCOPAmount))}</span>
          </div>
          
          <div className="quote-row">
            <span>🔗 Relación cCOP = COP:</span>
            <span className="relation">{quote.relation}</span>
          </div>
          
          <div className="quote-row">
            <span>Fee de swap (0.3%):</span>
            <span className="swap-fee">{formatCOP(parseFloat(quote.swapFee), 2)}</span>
          </div>
          
          <div className="quote-row">
            <span>Red:</span>
            <span className="network">{quote.network.toUpperCase()}</span>
          </div>
          
          <div className="quote-row">
            <span>Tipo de cambio:</span>
            <span className="exchange-rate">{quote.tipo_cambio?.replace(/\./g, ',')?.replace(/,/g, '.') || quote.tipo_cambio}</span>
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
