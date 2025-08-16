import React, { useState } from 'react';
import './APITester.css';

function APITester({ onTestAPI }) {
  const [testAddress, setTestAddress] = useState('0x1234567890123456789012345678901234567890');
  const [testAmount, setTestAmount] = useState('100000');
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState(null);

  const handleTestAPI = async () => {
    setIsTesting(true);
    setTestResults(null);
    
    try {
      console.log('🧪 Iniciando test de API CDP...');
      const results = await onTestAPI(testAddress, parseInt(testAmount));
      setTestResults(results);
    } catch (error) {
      setTestResults({ error: error.message });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="api-tester">
      <h3>🧪 Test de API CDP</h3>
      <p>Prueba la API de CDP directamente para verificar la configuración</p>
      
      <div className="test-inputs">
        <div className="input-group">
          <label>Dirección de Wallet:</label>
          <input
            type="text"
            value={testAddress}
            onChange={(e) => setTestAddress(e.target.value)}
            placeholder="0x..."
          />
        </div>
        
        <div className="input-group">
          <label>Monto en COP:</label>
          <input
            type="number"
            value={testAmount}
            onChange={(e) => setTestAmount(e.target.value)}
            placeholder="100000"
          />
        </div>
        
        <button 
          onClick={handleTestAPI}
          disabled={isTesting}
          className="test-button"
        >
          {isTesting ? 'Probando...' : '🧪 Probar API CDP'}
        </button>
      </div>

      {testResults && (
        <div className="test-results">
          <h4>📊 Resultados del Test:</h4>
          
          {testResults.error ? (
            <div className="error-result">
              <strong>❌ Error:</strong> {testResults.error}
            </div>
          ) : (
            <div className="success-result">
              <div className="result-item">
                <strong>✅ JWT Token:</strong> 
                <span className="token">{testResults.jwtToken?.substring(0, 20)}...</span>
              </div>
              
              <div className="result-item">
                <strong>✅ Session Token:</strong> 
                <span className="token">{testResults.sessionToken?.substring(0, 20)}...</span>
              </div>
              
              <div className="result-item">
                <strong>✅ URL Generada:</strong> 
                <span className="url">{testResults.onrampURL}</span>
              </div>
              
              <div className="result-item">
                <strong>✅ Payload Enviado:</strong>
                <pre className="payload">{JSON.stringify(testResults.payload, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="test-info">
        <p><strong>💡 Nota:</strong> Este test verifica la configuración de la API de CDP sin generar URLs de onramp reales.</p>
        <p><strong>📋 Verifica la consola del navegador</strong> para logs detallados de la API.</p>
      </div>
    </div>
  );
}

export default APITester;
