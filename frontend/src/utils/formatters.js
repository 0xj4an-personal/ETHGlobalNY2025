// Utilidades para formatear números en formato colombiano
// Punto (.) para miles, coma (,) para decimales

/**
 * Formatea un número en formato colombiano
 * @param {number} value - Valor a formatear
 * @param {number} decimals - Número de decimales (por defecto 0 para valores >= 100)
 * @returns {string} - Número formateado
 */
export function formatColombianNumber(value, decimals = 0) {
  try {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '0';
    
    // Determinar si usar decimales basado en el valor
    let finalDecimals = decimals;
    if (Math.abs(numValue) >= 100) {
      finalDecimals = 0; // Sin decimales para valores >= 100
    }
    
    // Formatear manualmente
    let formatted;
    if (finalDecimals === 0) {
      // Sin decimales: usar punto para miles
      formatted = Math.round(numValue).toLocaleString('es-CO');
    } else {
      // Con decimales: usar punto para miles y coma para decimales
      const roundedValue = Math.round(numValue * Math.pow(10, finalDecimals)) / Math.pow(10, finalDecimals);
      const parts = roundedValue.toString().split('.');
      
      // Formatear parte entera con puntos para miles
      const integerPart = parseInt(parts[0]).toLocaleString('es-CO');
      
      if (parts.length > 1) {
        // Agregar parte decimal con coma
        const decimalPart = parts[1].padEnd(finalDecimals, '0');
        formatted = `${integerPart},${decimalPart}`;
      } else {
        formatted = integerPart;
      }
    }
    
    return formatted;
  } catch (error) {
    console.error('❌ Error formateando número colombiano:', error);
    return '0';
  }
}

/**
 * Formatea un valor en Pesos Colombianos
 * @param {number} value - Valor en COP
 * @param {number} decimals - Número de decimales (por defecto 0 para valores >= 100)
 * @returns {string} - Valor formateado con símbolo de peso
 */
export function formatCOP(value, decimals = 0) {
  const formatted = formatColombianNumber(value, decimals);
  return `$${formatted}`;
}

/**
 * Formatea un valor en CELO
 * @param {number} value - Valor en CELO
 * @param {number} decimals - Número de decimales (por defecto 6)
 * @returns {string} - Valor formateado con símbolo CELO
 */
export function formatCELO(value, decimals = 6) {
  const formatted = formatColombianNumber(value, decimals);
  return `${formatted} CELO`;
}

/**
 * Formatea un valor en cCOP
 * @param {number} value - Valor en cCOP
 * @param {number} decimals - Número de decimales (por defecto 0 para valores >= 100)
 * @returns {string} - Valor formateado con símbolo cCOP
 */
export function formatCCOP(value, decimals = 0) {
  const formatted = formatColombianNumber(value, decimals);
  return `${formatted} cCOP`;
}
