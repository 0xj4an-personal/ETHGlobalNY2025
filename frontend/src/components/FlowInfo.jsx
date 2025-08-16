import React from 'react';
import './FlowInfo.css';

function FlowInfo() {
  return (
    <div className="flow-info">
      <h3>🔄 Flujo de la Transacción</h3>
      
      <div className="flow-steps">
        <div className="flow-step">
          <div className="step-number">1</div>
          <div className="step-content">
            <h4>Ingreso de COP</h4>
            <p>Ingresas la cantidad de pesos colombianos que quieres convertir</p>
          </div>
        </div>
        
        <div className="flow-arrow">→</div>
        
        <div className="flow-step">
          <div className="step-number">2</div>
          <div className="step-content">
            <h4>Pago con Tarjeta</h4>
            <p>Completas el pago en Coinbase usando tarjeta de crédito</p>
          </div>
        </div>
        
        <div className="flow-arrow">→</div>
        
        <div className="flow-step">
          <div className="step-number">3</div>
          <div className="step-content">
            <h4>Compra de Celo</h4>
            <p>Coinbase procesa tu pago y compra Celo en tu nombre</p>
          </div>
        </div>
        
        <div className="flow-arrow">→</div>
        
        <div className="flow-step">
          <div className="step-number">4</div>
          <div className="step-content">
            <h4>Swap Automático</h4>
            <p>El sistema convierte automáticamente Celo a cCOP usando Uniswap</p>
          </div>
        </div>
        
        <div className="flow-arrow">→</div>
        
        <div className="flow-step">
          <div className="step-number">5</div>
          <div className="step-content">
            <h4>Recibes cCOP</h4>
            <p>Recibes pesos digitales colombianos en tu wallet</p>
          </div>
        </div>
      </div>
      
      <div className="flow-note">
        <p><strong>💡 Nota importante:</strong> No necesitas hacer nada manual. El sistema se encarga de todo el proceso de conversión automáticamente.</p>
      </div>
    </div>
  );
}

export default FlowInfo;
