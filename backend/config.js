// Configuración del backend
const config = {
  port: 3002, // Puerto diferente al frontend
  cdp: {
    appId: '5e724356-f66f-45d2-accf-c0b562fd2edd',
    apiKey: '0761b732-f913-4923-9d08-0387a137de76',
    privateKey: 'c1Cdgly3sXPdb1XjalNSoZVZdDruSlKuUsT430xUx80IRdJtEd3vOUgDVjDTKmepVsjimvIqx+7n7bSmv1253g=='
  },
  cors: {
    frontendUrl: 'http://localhost:3000'
  }
};

module.exports = config;
