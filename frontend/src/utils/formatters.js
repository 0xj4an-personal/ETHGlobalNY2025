// Utilidades para formatear números en formato colombiano / Utilities for formatting numbers in Colombian format
// Punto (.) para miles, coma (,) para decimales / Dot (.) for thousands, comma (,) for decimals

/**
 * Formatea un número en formato colombiano / Formats a number in Colombian format
 * @param {number} value - Valor a formatear / Value to format
 * @param {number} decimals - Número de decimales (por defecto 0 para valores >= 100) / Number of decimals (default 0 for values >= 100)
 * @returns {string} - Número formateado / Formatted number
 */
export function formatColombianNumber(value, decimals = 0) {
  try {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '0';
    
    // Determinar si usar decimales basado en el valor / Determine whether to use decimals based on value
    let finalDecimals = decimals;
    if (Math.abs(numValue) >= 100) {
      finalDecimals = 0; // Sin decimales para valores >= 100 / No decimals for values >= 100
    }
    
    // Formatear manualmente / Format manually
    let formatted;
    if (finalDecimals === 0) {
      // Sin decimales: usar punto para miles / No decimals: use dot for thousands
      formatted = Math.round(numValue).toLocaleString('es-CO');
    } else {
      // Con decimales: usar punto para miles y coma para decimales / With decimals: use dot for thousands and comma for decimals
      const roundedValue = Math.round(numValue * Math.pow(10, finalDecimals)) / Math.pow(10, finalDecimals);
      const parts = roundedValue.toString().split('.');
      
      // Formatear parte entera con puntos para miles / Format integer part with dots for thousands
      const integerPart = parseInt(parts[0]).toLocaleString('es-CO');
      
      if (parts.length > 1) {
        // Agregar parte decimal con coma / Add decimal part with comma
        const decimalPart = parts[1].padEnd(finalDecimals, '0');
        formatted = `${integerPart},${decimalPart}`;
      } else {
        formatted = integerPart;
      }
    }
    
    return formatted;
  } catch (error) {
    console.error('❌ Error formateando número colombiano / Error formatting Colombian number:', error);
    return '0';
  }
}

/**
 * Formatea un valor en Pesos Colombianos / Formats a value in Colombian Pesos
 * @param {number} value - Valor en COP / Value in COP
 * @param {number} decimals - Número de decimales (por defecto 0 para valores >= 100) / Number of decimals (default 0 for values >= 100)
 * @returns {string} - Valor formateado con símbolo de peso / Formatted value with peso symbol
 */
export function formatCOP(value, decimals = 0) {
  const formatted = formatColombianNumber(value, decimals);
  return `$${formatted}`;
}

/**
 * Formatea un valor en CELO / Formats a value in CELO
 * @param {number} value - Valor en CELO / Value in CELO
 * @param {number} decimals - Número de decimales (por defecto 6) / Number of decimals (default 6)
 * @returns {string} - Valor formateado con símbolo CELO / Formatted value with CELO symbol
 */
export function formatCELO(value, decimals = 6) {
  const formatted = formatColombianNumber(value, decimals);
  return `${formatted} CELO`;
}

/**
 * Formatea un valor en cCOP / Formats a value in cCOP
 * @param {number} value - Valor en cCOP / Value in cCOP
 * @param {number} decimals - Número de decimales (por defecto 0 para valores >= 100) / Number of decimals (default 0 for values >= 100)
 * @returns {string} - Valor formateado con símbolo cCOP / Formatted value with cCOP symbol
 */
export function formatCCOP(value, decimals = 0) {
  const formatted = formatColombianNumber(value, decimals);
  return `${formatted} cCOP`;
}
