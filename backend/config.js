// Configuración del backend
const config = {
  port: 3002, // Puerto diferente al frontend
  cdp: {
    appId: '5e724356-f66f-45d2-accf-c0b562fd2edd',
    apiKey: '38ee86f8-1e30-42a1-8125-bed547762b21',
    privateKey: 'r5qehxv90t95wO1Xm/Q6G8V/cK8E3tgt8x/udLuzma6joijqcUUCMGU1OMi9++0IWzld/i4+y3aJZor+7KI8Cg=='
  },
  cors: {
    frontendUrl: 'http://localhost:3000'
  }
};

module.exports = config;
