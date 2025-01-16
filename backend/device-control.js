const express = require("express");
const axios = require("axios");
const { generateSignature, getAccessToken } = require("./tuya"); // Importar funções do arquivo `tuya.js`

const router = express.Router();

// Configurações específicas do dispositivo
const deviceId = "ebf025fcebde746b5akmak"; // ID do dispositivo Tuya
const BaseUrl = "https://openapi.tuyaus.com"; // URL base da Tuya API

// Função para enviar comando ao dispositivo Tuya
async function sendDeviceCommand(commandCode, commandValue) {
  try {
    const accessToken = await getAccessToken(); // Obter o token de acesso
    const tuyatime = `${Date.now()}`;
    const URL = `/v1.0/iot-03/devices/${deviceId}/commands`;
    const StringToSign = `${process.env.CLIENT_ID}${accessToken}${tuyatime}POST\n\n${URL}`;
    const RequestSign = generateSignature(StringToSign, process.env.CLIENT_SECRET);

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
          sign_method: "HMAC-SHA256",
          client_id: process.env.CLIENT_ID,
          t: tuyatime,
          mode: "cors",
          "Content-Type": "application/json",
          sign: RequestSign,
          access_token: accessToken,
        },
      }
    );

    console.log(`Comando enviado: ${commandCode} = ${commandValue}`);
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
