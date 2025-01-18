const express = require("express");
const axios = require("axios");
const { ClientID, ClientSecret,generateSignature, EmptyBodyEncoded, debug } = require("./tuya"); // Importando funções e variáveis do arquivo tuya.js

const router = express.Router();

// Configurações específicas do dispositivo
const deviceId = "ebf025fcebde746b5akmak"; // ID do dispositivo Tuya
const BaseUrl = "https://openapi.tuyaus.com"; // URL base da Tuya API

// Obter token de acesso
let cachedToken = null;
let tokenExpiration = null;

/**
 * Obter token de acesso com cache
 * @returns {Promise<string>} O token de acesso válido
 */
async function getAccessToken() {
  const currentTime = Date.now();

  // Verificar se o token no cache ainda é válido
  if (cachedToken && tokenExpiration && currentTime < tokenExpiration) {
    console.log("Usando token do cache:", cachedToken);
    return cachedToken;
  }

  const tuyatime = `${currentTime}`;
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

    if (response.data.success) {
      cachedToken = response.data.result.access_token;
      tokenExpiration = currentTime + response.data.result.expire_time * 1000; // Calcula a expiração
      console.log("Novo token gerado:", cachedToken);
      return cachedToken;
    } else {
      throw new Error(`Erro ao obter token: ${response.data.msg}`);
    }
  } catch (error) {
    console.error("Erro ao buscar Access Token:", error.message);
    throw error;
  }
}


/**
 * Função para enviar comando ao dispositivo Tuya
 * @param {string} commandCode - O código do comando (ex: "switch_1" para ligar/desligar)
 * @param {boolean} commandValue - O valor do comando (true para ligar, false para desligar)
 */
async function sendDeviceCommand(commandCode, commandValue) {
  try {
    const accessToken = await getAccessToken(); // Usa o token do cache ou gera um novo
    const tuyatime = `${Date.now()}`; // Gera um timestamp a cada requisição
    const URL = `/v1.0/iot-03/devices/${deviceId}/commands`;
    const StringToSign = `${ClientID}${accessToken}${tuyatime}POST\n${EmptyBodyEncoded}\n\n${URL}`;
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
          'sign': RequestSign,
          'access_token': accessToken, // Adiciona o token de acesso válido
        },
      }
    );
    console.log("URL:", URL);
    console.log("StringToSign:", StringToSign);
    console.log("RequestSign:", RequestSign);
    console.log("Headers:", {
                  sign_method: "HMAC-SHA256",
                  client_id: ClientID,
                  t: tuyatime,
                  sign: RequestSign,
                  access_token: accessToken,
});
    console.log("Comando enviado: ", { commandCode, commandValue });

    console.log("Comando enviado com sucesso:", response.data);
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
