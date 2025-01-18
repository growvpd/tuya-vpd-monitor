const express = require("express");
const axios = require("axios");
const { ClientID, ClientSecret, getAccessToken, generateSignature, EmptyBodyEncoded } = require("./tuya"); // Importando funções e variáveis do arquivo tuya.js

const router = express.Router();

// Configurações específicas do dispositivo
const deviceId = "ebf025fcebde746b5akmak"; // ID do dispositivo Tuya
const BaseUrl = "https://openapi.tuyaus.com"; // URL base da Tuya API

/**
 * Função para enviar comando ao dispositivo Tuya
 * @param {string} commandCode - O código do comando (ex: "switch_1" para ligar/desligar)
 * @param {boolean} commandValue - O valor do comando (true para ligar, false para desligar)
 */
async function sendDeviceCommand(commandCode, commandValue) {
  try {
    // Obtém o token de acesso atualizado
    const accessToken = await getAccessToken();

    // Configurações do cabeçalho de autenticação
    const tuyatime = `${Date.now()}`; // Gera um timestamp a cada requisição
    const URL = `/v1.0/iot-03/devices/${deviceId}/commands`; // Endpoint para enviar comandos ao dispositivo
    const StringToSign = `${ClientID}${accessToken}${tuyatime}GET\n${EmptyBodyEncoded}\n\n${URL}`;
    const RequestSign = generateSignature(StringToSign, ClientSecret);

    // Realiza a requisição POST para enviar o comando ao dispositivo
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
    
    console.log(`Comando enviado: ${commandCode} = ${commandValue}`);
    console.log("Resposta do servidor:", response.data);
    return response.data; // Retorna a resposta do servidor
  } catch (error) {
    console.error("Erro ao enviar comando para o dispositivo:", error.message);
    throw error; // Lança o erro para que seja tratado no endpoint correspondente
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
