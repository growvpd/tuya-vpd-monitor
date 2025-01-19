const express = require("express");
const axios = require("axios");
const crypto = require("crypto");
const { ClientID, ClientSecret, generateSignature, EmptyBodyEncoded, debug, getTemperature, updateTemperature , getDeviceStatus , extractTemperatureAndHumidity , fetchTuyaDataWithCache } = require("./tuya");

const router = express.Router();
const deviceId = "ebf025fcebde746b5akmak"; // ID do dispositivo
const BaseUrl = "https://openapi.tuyaus.com"; // URL base da API Tuya

// Configurações de temperatura
let minTemperature = 24; // Temperatura mínima para desligar o AC
let maxTemperature = 26; // Temperatura máxima para ligar o AC

// Cache para o token de acesso
let cachedToken = null;
let tokenExpiration = null;

/**
 * Obter token de acesso com cache
 */
async function getAccessToken() {
  const currentTime = Date.now();

  if (cachedToken && tokenExpiration && currentTime < tokenExpiration) {
    console.log("Usando token do cache:", cachedToken);
    return cachedToken;
  }

  const tuyatime = Math.floor(currentTime).toString();
  const URL = "/v1.0/token?grant_type=1";
  const StringToSign = `${ClientID}${tuyatime}GET\n${EmptyBodyEncoded}\n\n${URL}`;
  if (debug) console.log("StringToSign is now:", StringToSign);

  const AccessTokenSign = generateSignature(StringToSign, ClientSecret);
  if (debug) console.log("AccessTokenSign is now:", AccessTokenSign);

  try {
    const response = await axios.get(`${BaseUrl}${URL}`, {
      headers: {
        sign_method: "HMAC-SHA256",
        client_id: ClientID,
        t: tuyatime,
        "Content-Type": "application/json",
        sign: AccessTokenSign,
      },
    });

    if (response.data.success) {
      cachedToken = response.data.result.access_token;
      tokenExpiration = currentTime + response.data.result.expire_time * 1000;
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
 * Enviar comando ao dispositivo
 */
async function sendDeviceCommand(commandCode, commandValue) {
  try {
    const accessToken = await getAccessToken();
    const tuyatime = Math.floor(Date.now()).toString();
    const URL = `/v1.0/iot-03/devices/${deviceId}/commands`;
    const body = JSON.stringify({
      commands: [{ code: commandCode, value: commandValue }],
    });
    const Content_SHA256 = crypto.createHash("sha256").update(body, "utf8").digest("hex");
    const StringToSign = `${ClientID}${accessToken}${tuyatime}POST\n${Content_SHA256}\n\n${URL}`;
    const RequestSign = generateSignature(StringToSign, ClientSecret);

    const response = await axios.post(
      `${BaseUrl}${URL}`,
      { commands: [{ code: commandCode, value: commandValue }] },
      {
        headers: {
          sign_method: "HMAC-SHA256",
          client_id: ClientID,
          t: tuyatime,
          "Content-Type": "application/json",
          sign: RequestSign,
          access_token: accessToken,
        },
      }
    );
    console.log("Comando enviado com sucesso:", response.data);
    return response.data;
  } catch (error) {
    console.error("Erro ao enviar comando para o dispositivo:", error.message);
    throw error;
  }
}

/**
 * Monitorar e controlar automaticamente o AC com base na temperatura
 */
async function monitorTemperature() {
  try {
    const deviceStatus = await fetchTuyaDataWithCache(deviceId);
    const sensorData = extractTemperatureAndHumidity(deviceStatus);

    if (!sensorData) {
      console.log("Dispositivo sem sensores de temperatura/umidade. Nenhuma ação necessária.");
      return; // Sai da função se não houver sensores
    }

    const { temperature } = sensorData;
    console.log("Temperatura atual:", temperature);
    console.log("Temperatura mínima:", minTemperature);
    console.log("Temperatura máxima:", maxTemperature);

    if (temperature >= maxTemperature) {
      console.log(`Temperatura ${temperature} acima de ${maxTemperature}. Ligando o ar-condicionado...`);
      await sendDeviceCommand("switch_1", true);
    } else if (temperature <= minTemperature) {
      console.log(`Temperatura ${temperature} abaixo de ${minTemperature}. Desligando o ar-condicionado...`);
      await sendDeviceCommand("switch_1", false);
    } else {
      console.log(`Temperatura ${temperature} está dentro da faixa aceitável. Nenhuma ação necessária.`);
    }
  } catch (error) {
    console.error("Erro ao monitorar temperatura:", error.message);
  }
}


// Configuração para monitoramento automático a cada 30 segundos
setInterval(monitorTemperature,  1 * 60 * 1000);

// Rotas
router.post("/on", async (req, res) => {
  try {
    const result = await sendDeviceCommand("switch_1", true);
    res.json({ success: true, message: "Dispositivo ligado com sucesso!", data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erro ao ligar o dispositivo.", error: error.message });
  }
});

router.post("/off", async (req, res) => {
  try {
    const result = await sendDeviceCommand("switch_1", false);
    res.json({ success: true, message: "Dispositivo desligado com sucesso!", data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erro ao desligar o dispositivo.", error: error.message });
  }
});

router.post("/set-temperature", (req, res) => {
  const { minTemp, maxTemp } = req.body;
  if (minTemp !== undefined) minTemperature = parseFloat(minTemp);
  if (maxTemp !== undefined) maxTemperature = parseFloat(maxTemp);
  res.json({ success: true, message: "Temperaturas atualizadas com sucesso!", minTemperature, maxTemperature });
});

module.exports = router;

// Rota para obter o estado atual do dispositivo
router.get("/status", async (req, res) => {
  try {
    // Obtem o token de acesso
    const accessToken = await getAccessToken();

    // Obtém o status do dispositivo
    const deviceStatus = await getDeviceStatus(accessToken, deviceId);

    // Extrai informações relevantes
    const { temperature, humidity } = extractTemperatureAndHumidity(deviceStatus);

    const powerStatus = deviceStatus.find(device => device.id === deviceId)?.status.find(s => s.code === "switch_1")?.value;

    // Retorna as informações no formato JSON
    res.json({
      success: true,
      temperature,
      humidity,
      powerStatus: powerStatus ? "Ligado" : "Desligado"
    });
  
  } catch (error) {
    console.error("Erro ao obter o estado do dispositivo:", error.message);
    res.status(500).json({ success: false, message: "Erro ao obter o estado do dispositivo.", error: error.message });
  }
});

