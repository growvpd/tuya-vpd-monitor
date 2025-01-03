const { TuyaContext } = require('@tuya/tuya-connector');

const tuya = new TuyaContext({
  baseUrl: 'https://openapi.tuyaus.com',
  accessKey: process.env.TUYA_ACCESS_KEY,
  secretKey: process.env.TUYA_SECRET_KEY,
});

async function sendTuyaCommand(deviceId, commandCode, value) {
  try {
    const response = await tuya.request({
      method: 'POST',
      path: `/v1.0/devices/${deviceId}/commands`,
      body: {
        commands: [{ code: commandCode, value }],
      },
    });
    console.log('Comando enviado:', response);
  } catch (error) {
    console.error('Erro ao enviar comando:', error.message);
    throw error;
  }
}

module.exports = { fetchTuyaData, sendTuyaCommand };
