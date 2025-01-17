const axios = require('axios');
const crypto = require('crypto');

// Configurações
const debug = true;
const ClientID = "7j3tg7crd8gxr4rdsu7s"; // Substitua pelo seu Client ID
const ClientSecret = "ed01098ca59c40d2845de5ef25bb1dc9"; // Substitua pelo seu Client Secret
const BaseUrl = "https://openapi.tuyaus.com"; // URL base da API Tuya
const EmptyBodyEncoded = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
const deviceIds = "eb8faf00e42469ffaahezh"; // Substitua pelo ID do dispositivo que deseja controlar

// Cache para token de acesso
let cachedAccessToken = null;
let tokenExpirationTime = null;
const CACHE_DURATION = 10 * 60 * 1000; // Cache válido por 10 minutos

/**
 * Função para gerar a assinatura HMAC-SHA256
 * @param {string} stringToSign - A string que será assinada
 * @param {string} secret - A chave secreta usada na assinatura
 * @returns {string} - Assinatura gerada
 */
function generateSignature(stringToSign, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(stringToSign)
    .digest('hex')
    .toUpperCase();
}

/**
 * Obter o token de acesso da Tuya API
 * @returns {Promise<string>} - Token de acesso válido
 */
async function getAccessToken() {
  // Retorna o token em cache se ainda for válido
  if (cachedAccessToken && tokenExpirationTime > Date.now()) {
    console.log("Usando token de acesso em cache.");
    return cachedAccessToken;
  }

  const tuyatime = `${Date.now()}`;
  const URL = "/v1.0/token?grant_type=1";
  const StringToSign = `${ClientID}${tuyatime}GET\n${EmptyBodyEncoded}\n\n${URL}`;
  const AccessTokenSign = generateSignature(StringToSign, ClientSecret);

  try {
    const response = await axios.get(`${BaseUrl}${URL}`, {
      headers: {
        sign_method: "HMAC-SHA256",
        client_id: ClientID,
        t: tuyatime,
        mode: "cors",
        "Content-Type": "application/json",
        sign: AccessTokenSign,
      },
    });

    const { access_token, expire_time } = response.data.result;
    cachedAccessToken = access_token;
    tokenExpirationTime = Date.now() + expire_time * 1000;

    console.log("Novo token obtido:", cachedAccessToken);
    return cachedAccessToken;
  } catch (error) {
    console.error("Erro ao obter token de acesso:", error.message);
    throw error;
  }
}

/**
 * Obter status do dispositivo
 * @param {string} accessToken - Token de acesso válido
 * @param {string} deviceIds - IDs dos dispositivos a serem consultados
 * @returns {Promise<object>} - Status dos dispositivos
 */
async function getDeviceStatus(accessToken, deviceIds) {
  const tuyatime = `${Date.now()}`;
  const URL = `/v1.0/iot-03/devices/status?device_ids=${deviceIds}`;
  const StringToSign = `${ClientID}${accessToken}${tuyatime}GET\n${EmptyBodyEncoded}\n\n${URL}`;
  const RequestSign = generateSignature(StringToSign, ClientSecret);

  try {
    const response = await axios.get(`${BaseUrl}${URL}`, {
      headers: {
        sign_method: "HMAC-SHA256",
        client_id: ClientID,
        t: tuyatime,
        mode: "cors",
        "Content-Type": "application/json",
        sign: RequestSign,
        access_token: accessToken,
      },
    });

    console.log("RequestResponse is now:", response.data);
    return response.data.result;
  } catch (error) {
    console.error("Erro ao buscar status do dispositivo:", error.message);
    throw error;
  }
}

/**
 * Obter dados do dispositivo com cache
 * @param {string} deviceIds - IDs dos dispositivos a serem consultados
 * @returns {Promise<object>} - Dados do dispositivo com cache
 */
async function fetchTuyaDataWithCache(deviceIds) {
  if (cachedData && cacheTimestamp && Date.now() - cacheTimestamp < CACHE_DURATION) {
    console.log("Retornando dados do cache.");
    return cachedData;
  }

  const accessToken = await getAccessToken();
  const deviceStatus = await getDeviceStatus(accessToken, deviceIds);

  cachedData = deviceStatus;
  cacheTimestamp = Date.now();
  console.log("Dados atualizados no cache.");
  return cachedData;
}

/**
 * Extrair temperatura e umidade do status do dispositivo
 * @param {object} deviceStatus - Status do dispositivo
 * @returns {object} - Temperatura e umidade extraídas
 */
function extractTemperatureAndHumidity(deviceStatus) {
  let temperature = null;
  let humidity = null;

  deviceStatus.forEach((device) => {
    device.status.forEach((item) => {
      if (item.code === 'va_temperature') {
        temperature = item.value / 10; // Normalizar para °C
      } else if (item.code === 'va_humidity') {
        humidity = item.value / 10;
      }
    });
  });

  if (temperature === null || humidity === null) {
    throw new Error("Não foi possível encontrar temperatura ou umidade no status do dispositivo.");
  }

  console.log("Temperatura:", temperature, "Umidade:", humidity);
  return { temperature, humidity };
}

// Exportações
module.exports = {
  ClientID,
  ClientSecret,
  BaseUrl,
  EmptyBodyEncoded,
  deviceIds,
  generateSignature,
  getAccessToken,
  getDeviceStatus,
  fetchTuyaDataWithCache,
  extractTemperatureAndHumidity,
};
