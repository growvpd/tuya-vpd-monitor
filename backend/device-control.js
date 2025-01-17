const express = require("express");
const axios = require("axios");
const { ClientID, ClientSecret, generateSignature, BaseUrl, EmptyBodyEncoded, debug } = require('./tuya'); // Importar funções e variáveis do arquivo `tuya.js`


const router = express.Router();

// Configurações específicas do dispositivo
const deviceId = "ebf025fcebde746b5akmak"; // ID do dispositivo Tuya

// Obter token de acesso
async function getAccessToken() {
  const tuyatime = `${Date.now()}`; // Gera um timestamp a cada requisição
  const URL = "/v1.0/token?grant_type=1";
  const StringToSign = `${ClientID}${tuyatime}GET\n${EmptyBodyEncoded}\n\n${URL}`;
  if (debug) console.log(`StringToSign is now: ${StringToSign}`);

  const AccessTokenSign = generateSignature(StringToSign, ClientSecret);
  if (debug) console.log(`AccessTokenSign is now: ${AccessTokenSign}`);

  try {
    const response = await axios.get(`${BaseUrl}${URL}`, {
      headers: {
        'sign_method': 'HMAC-SHA256',
        'client_id': ClientID,
        't': tuyatime,
        'mode': 'cors',
        'Content-Type': 'application/json',
        'sign': AccessTokenSign,
      },
    });
    if (debug) console.log(`AccessTokenResponse is now:`, response.data);
    return response.data.result.access_token;
  } catch (error) {
    console.error("Error fetching Access Token:", error.message);
    throw error;
  }
}

// Função para enviar comando ao dispositivo Tuya
async function sendDeviceCommand(commandCode, commandValue) {
  try {
    console.log(`Enviando comando: ${commandCode} = ${commandValue}`);
    const accessToken = await getAccessToken(); // Obter token de acesso
    const tuyatime = `${Date.now()}`;
    const URL = `/v1.0/iot-03/devices/${deviceId}/commands`;
    const StringToSign = `${ClientID}${accessToken}${tuyatime}POST\n\n${URL}`;
    const RequestSign = generateSignature(StringToSign, ClientSecret);

    const response = await axios.post(
      `${BaseUrl}${URL}`,
      {
        commands: [
          {
            code: commandCode,
            value: commandValue,
          },
        ],
      },
      {
        headers: {
          'sign_method': 'HMAC-SHA256',
          'client_id': ClientID,
          't': tuyatime,
          'mode': 'cors',
          'Content-Type': 'application/json',
          'sign': AccessTokenSign,
        },
      }
    );

    console.log("Resposta do servidor:", response.data);
    return response.data;
  } catch (error) {
    console.error("Erro ao enviar comando para o dispositivo:", error.message);
    throw error;
  }
}


// Rota para ligar o dispositivo
router.post("/on", async (req, res) => {
  try {
    const result = await sendDeviceCommand("switch_1", true); // Envia comando para ligar
    res.json({ success: true, message: "Dispositivo ligado com sucesso!", data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erro ao ligar o dispositivo.", error: error.message });
  }
});

// Rota para desligar o dispositivo
router.post("/off", async (req, res) => {
  try {
    const result = await sendDeviceCommand("switch_1", false); // Envia comando para desligar
    res.json({ success: true, message: "Dispositivo desligado com sucesso!", data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erro ao desligar o dispositivo.", error: error.message });
  }
});

module.exports = router;
