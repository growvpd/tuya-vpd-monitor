const axios = require('axios');
const crypto = require('crypto');

// Configurações gerais
const debug = true;
const ClientID = "SEU_CLIENT_ID";
const ClientSecret = "SEU_CLIENT_SECRET";
const BaseUrl = "https://openapi.tuyaus.com";
const EmptyBodyEncoded = crypto.createHash("sha256").update("", "utf8").digest("hex");

// IDs dos dispositivos
const thermostatDeviceId = "ID_TERMOSTATO"; // Substituir pelo ID do termostato
const switchDeviceId = "ID_INTERRUPTOR";   // Substituir pelo ID do interruptor

// Função para gerar assinatura HMAC-SHA256
function generateSignature(stringToSign, secret) {
  return crypto.createHmac('sha256', secret).update(stringToSign).digest('hex').toUpperCase();
}

// Função para obter token de acesso
let cachedToken = null;
let tokenExpiration = null;

async function getAccessToken() {
  const currentTime = Date.now();

  if (cachedToken && tokenExpiration && currentTime < tokenExpiration) {
    console.log("Usando token do cache:", cachedToken);
    return cachedToken;
  }

  const tuyatime = `${currentTime}`;
  const URL = "/v1.0/token?grant_type=1";
  const StringToSign = `${ClientID}${tuyatime}GET\n${EmptyBodyEncoded}\n\n${URL}`;
  const AccessTokenSign = generateSignature(StringToSign, ClientSecret);

  try {
    const response = await axios.get(`${BaseUrl}${URL}`, {
      headers: {
        sign_method: "HMAC-SHA256",
        client_id: ClientID,
        t: tuyatime,
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
    console.error("Erro ao buscar token de acesso:", error.message);
    throw error;
  }
}

// Função para buscar status de um dispositivo
async function getDeviceStatus(deviceId) {
  const accessToken = await getAccessToken();
  const tuyatime = `${Date.now()}`;
  const URL = `/v1.0/iot-03/devices/${deviceId}/status`;
  const StringToSign = `${ClientID}${accessToken}${tuyatime}GET\n${EmptyBodyEncoded}\n\n${URL}`;
  const RequestSign = generateSignature(StringToSign, ClientSecret);

  try {
    const response = await axios.get(`${BaseUrl}${URL}`, {
      headers: {
        sign_method: "HMAC-SHA256",
        client_id: ClientID,
        t: tuyatime,
        sign: RequestSign,
        access_token: accessToken,
      },
    });
    return response.data.result;
  } catch (error) {
    console.error(`Erro ao buscar status do dispositivo ${deviceId}:`, error.message);
    throw error;
  }
}

// Exportações
module.exports = {
  getAccessToken,
  getDeviceStatus,
  thermostatDeviceId,
  switchDeviceId,
};
