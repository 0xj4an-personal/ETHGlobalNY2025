import React, { useState } from 'react'
import './App.css'
import cdpService from './services/cdpService'
import QuoteDisplay from './components/QuoteDisplay'
import FlowInfo from './components/FlowInfo'
import APITester from './components/APITester'

function App() {
  const [walletAddress, setWalletAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [quote, setQuote] = useState(null)
  const [showQuote, setShowQuote] = useState(false)

  const handleGetQuote = async () => {
    if (!walletAddress || !amount) {
      alert('Por favor completa todos los campos')
      return
    }

    setIsLoading(true)
    
    try {
      // Obtener quote del servicio CDP (ahora en COP)
      const quoteData = await cdpService.getQuote(parseFloat(amount))
      setQuote(quoteData)
      setShowQuote(true)
      
    } catch (error) {
      console.error('Error:', error)
      alert('Error al obtener el quote')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAmountButton = (amountValue) => {
    setAmount(amountValue.toString())
  }

  const handleProceedWithOnramp = async () => {
    if (!quote) return
    
    setIsLoading(true)
    
    try {
      console.log('Iniciando onramp para:', walletAddress, 'Monto COP:', amount)
      
      // Generar URL de onramp usando el servicio CDP (pasando monto en COP)
      const onrampData = await cdpService.generateOnrampURL(walletAddress, parseFloat(amount))
      
      console.log('Onramp data generada:', onrampData)
      console.log('URL generada:', onrampData.url)
      
      // Verificar que la URL se generó correctamente
      if (!onrampData.url || onrampData.url.includes('undefined')) {
        throw new Error('URL de onramp no válida generada')
      }
      
      // Redirigir al usuario a la URL de onramp
      window.open(onrampData.url, '_blank')
      
      // Resetear el estado
      setShowQuote(false)
      setQuote(null)
      
      alert(`¡Onramp iniciado! 
      
Flujo: ${onrampData.flow}
Monto: ${onrampData.amountCOP} COP (${onrampData.amountUSD} USD)
Has sido redirigido a Coinbase para comprar Celo.`)
      
    } catch (error) {
      console.error('Error completo:', error)
      console.error('Stack trace:', error.stack)
      alert(`Error al iniciar el onramp: ${error.message}

Por favor, verifica la consola del navegador para más detalles.`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelQuote = () => {
    setShowQuote(false)
    setQuote(null)
  }

  const handleTestAPI = async (testAddress, testAmount) => {
    try {
      console.log('🧪 Test API iniciado para:', testAddress, testAmount);
      
      // Generar JWT token
      const jwtToken = await cdpService.generateJWTToken();
      
      // Generar session token
      const sessionToken = await cdpService.generateSessionTokenWithAddress(testAddress);
      
      // Generar URL de onramp
      const onrampData = await cdpService.generateOnrampURL(testAddress, testAmount);
      
      // Preparar payload para mostrar
      const payload = {
        addresses: [
          {
            address: testAddress,
            blockchains: ["celo"]
          }
        ],
        assets: ["CELO"],
        destinationWallets: [
          {
            address: testAddress,
            assets: ["CELO"],
            blockchains: ["celo"],
            supportedNetworks: ["celo"]
          }
        ]
      };
      
      return {
        jwtToken,
        sessionToken,
        onrampURL: onrampData.url,
        payload
      };
    } catch (error) {
      console.error('❌ Error en test API:', error);
      throw error;
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🚀 cCOP Onramp App</h1>
        <p>Compra cCOP usando Coinbase y Uniswap</p>
        <div className="testing-notice">
          ⚠️ <strong>JWT AUTHENTICATION FALTANTE:</strong> API key configurada pero se necesita JWT real para session tokens válidos.
        </div>
      </header>

      <main className="app-main">
        <div className="form-container">
          <div className="form-group">
            <label htmlFor="wallet">Dirección de Wallet:</label>
            <input
              id="wallet"
              type="text"
              placeholder="0x... o nombre.eth"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="amount">Monto en COP:</label>
            <input
              id="amount"
              type="number"
              placeholder="100000"
              min="10000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <div className="amount-buttons">
              <button 
                type="button" 
                onClick={() => handleAmountButton(100000)}
                className="amount-btn"
              >
                100.000 COP
              </button>
              <button 
                type="button" 
                onClick={() => handleAmountButton(250000)}
                className="amount-btn"
              >
                250.000 COP
              </button>
              <button 
                type="button" 
                onClick={() => handleAmountButton(500000)}
                className="amount-btn"
              >
                500.000 COP
              </button>
              <button 
                type="button" 
                onClick={() => handleAmountButton(1000000)}
                className="amount-btn"
              >
                1.000.000 COP
              </button>
            </div>
          </div>

          <button 
            onClick={handleGetQuote}
            disabled={isLoading || !walletAddress || !amount}
            className="onramp-button"
          >
            {isLoading ? 'Obteniendo Quote...' : 'Obtener Quote'}
          </button>
        </div>

        {/* Mostrar quote si está disponible */}
        {showQuote && quote && (
          <QuoteDisplay 
            quote={quote}
            onProceed={handleProceedWithOnramp}
            onCancel={handleCancelQuote}
          />
        )}

        <FlowInfo />
        
        <APITester onTestAPI={handleTestAPI} />
      </main>
    </div>
  )
}

export default App
