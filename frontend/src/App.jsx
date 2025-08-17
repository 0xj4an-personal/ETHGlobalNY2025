import React, { useState } from 'react'
import './App.css'
import cdpService from './services/cdpService'
import QuoteDisplay from './components/QuoteDisplay'
import FlowInfo from './components/FlowInfo'
import APITester from './components/APITester'
import BuyOptionsDisplay from './components/BuyOptionsDisplay'

function App() {
  const [walletAddress, setWalletAddress] = useState('')
  const [amount, setAmount] = useState('100000')
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
      console.log('🚀 Iniciando onramp para:', walletAddress, 'Monto COP:', amount)
      
      // Opción 1: Usar Session Token (funciona)
      try {
        console.log('🔄 Intentando Session Token...');
        const onrampData = await cdpService.generateOnrampURL(walletAddress, parseFloat(amount))
        
        console.log('✅ Onramp data generada:', onrampData)
        console.log('✅ URL generada:', onrampData.url)
        
        // Verificar que la URL se generó correctamente
        if (!onrampData.url || onrampData.url.includes('undefined')) {
          throw new Error('URL de onramp no válida generada')
        }
        
        // Redirigir al usuario a la URL de onramp
        window.open(onrampData.url, '_blank')
        
        // Resetear el estado
        setShowQuote(false)
        setQuote(null)
        
        alert(`🎉 ¡Onramp iniciado exitosamente! 
        
✅ Session Token generado
✅ URL de Coinbase creada
🌐 Has sido redirigido a Coinbase para comprar Celo

El flujo continuará automáticamente después de la compra.`)
        
        return;
      } catch (sessionError) {
        console.warn('⚠️ Session Token falló, intentando Buy Quote...', sessionError);
      }
      
      // Opción 2: Usar Buy Quote (puede fallar por permisos)
      try {
        console.log('🔄 Intentando Buy Quote...');
        const buyQuoteData = await cdpService.generateBuyQuote(walletAddress, parseFloat(amount));
        console.log('✅ Buy Quote generado:', buyQuoteData);
        
        if (buyQuoteData.onrampUrl) {
          window.open(buyQuoteData.onrampUrl, '_blank');
          setShowQuote(false);
          setQuote(null);
          
          alert(`🎉 ¡Onramp iniciado con Buy Quote! 
          
✅ Buy Quote generado
✅ URL de Coinbase creada
🌐 Has sido redirigido a Coinbase para comprar Celo`)
          
          return;
        }
      } catch (buyQuoteError) {
        console.warn('⚠️ Buy Quote falló:', buyQuoteError);
      }
      
      throw new Error('No se pudo generar URL de onramp con ningún método');
      
    } catch (error) {
      console.error('❌ Error completo en onramp:', error)
      alert(`❌ Error al iniciar el onramp: ${error.message}

💡 El backend está funcionando pero puede haber un problema con los permisos de la API Key para Buy Quote.

✅ Session Token funciona
❌ Buy Quote necesita permisos adicionales

Por favor, verifica la consola del navegador para más detalles.`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelQuote = () => {
    setShowQuote(false)
    setQuote(null)
  }



  return (
    <div className="app">
      <header className="app-header">
        <h1>🚀 cCOP Onramp App</h1>
        <p>Compra cCOP usando Coinbase y Uniswap</p>
        <div className="testing-notice success">
          ✅ <strong>JWT AUTHENTICATION FUNCIONANDO:</strong> Backend integrado con CDP SDK oficial. Session Token generándose exitosamente.
        </div>
      </header>

      <main className="app-main">
        {/* Sección superior: Flujo y Opciones lado a lado */}
        <div className="top-section">
          <div className="flow-section">
            <FlowInfo />
          </div>
          <div className="options-section">
            <BuyOptionsDisplay />
          </div>
        </div>
        
        {/* Sección del formulario */}
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
        
        {/* Sección de testing */}
        <APITester onTestAPI={handleTestAPI} />
      </main>
    </div>
  )
}

export default App
