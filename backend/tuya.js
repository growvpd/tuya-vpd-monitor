const axios = require('axios');

// Configurações da Tuya
const CLIENT_ID = process.env.TUYA_CLIENT_ID;
const CLIENT_SECRET = process.env.TUYA_CLIENT_SECRET;
const API_BASE = 'https://openapi.tuyaus.com/v1.0';
let ACCESS_TOKEN = null;

// Função para obter o token de acesso
async function getAccessToken() {
  try {
    if (ACCESS_TOKEN) {
      return ACCESS_TOKEN; // Usa o token em cache se disponível
    }

    const response = await axios.post(`${API_BASE}/token`, {}, {
      headers: {
        'Content-Type': 'application/json',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      },
    });

    ACCESS_TOKEN = response.data.result.access_token;
    setTimeout(() => (ACCESS_TOKEN = null), (response.data.result.expire_time - 60) * 1000); // Expira o token um minuto antes do tempo total
    return ACCESS_TOKEN;
  } catch (error) {
    console.error('Erro ao obter o token de acesso:', error.response?.data || error.message);
    throw new Error('Falha ao obter o token de acesso');
  }
}

// Função para enviar comandos para o dispositivo
async function sendTuyaCommand(deviceId, commandCode, value) {
  try {
    const token = await getAccessToken();

    const command = {
      commands: [{ code: commandCode, value }],
    };

    const response = await axios.post(
      `${API_BASE}/devices/${deviceId}/commands`,
      command,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`Comando enviado com sucesso: ${commandCode} = ${value}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao enviar comando:', error.response?.data || error.message);
    throw new Error('Falha ao enviar comando');
  }
}

module.exports = {
  sendTuyaCommand,
};
