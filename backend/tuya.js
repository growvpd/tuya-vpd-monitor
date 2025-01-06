const axios = require('axios');
const crypto = require('crypto');

// Configurações
const debug = true;
const ClientID = "7j3tg7crd8gxr4rdsu7s";
const ClientSecret = "ed01098ca59c40d2845de5ef25bb1dc9";
const BaseUrl = "https://openapi.tuyaus.com";
const EmptyBodyEncoded = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
const deviceIds = "eb8faf00e42469ffaahezh";

// Função para gerar a assinatura HMAC-SHA256
function generateSignature(stringToSign, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(stringToSign)
    .digest('hex')
    .toUpperCase();
}

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

// Obter status do dispositivo
async function getDeviceStatus(accessToken, deviceIds) {
  const tuyatime = `${Date.now()}`; // Gera um timestamp a cada requisição
  const URL = `/v1.0/iot-03/devices/status?device_ids=${deviceIds}`;
  const StringToSign = `${ClientID}${accessToken}${tuyatime}GET\n${EmptyBodyEncoded}\n\n${URL}`;
  if (debug) console.log(`StringToSign is now: ${StringToSign}`);

  const RequestSign = generateSignature(StringToSign, ClientSecret);
  if (debug) console.log(`RequestSign is now: ${RequestSign}`);

  try {
    const response = await axios.get(`${BaseUrl}${URL}`, {
      headers: {
        'sign_method': 'HMAC-SHA256',
        'client_id': ClientID,
        't': tuyatime,
        'mode': 'cors',
        'Content-Type': 'application/json',
        'sign': RequestSign,
        'access_token': accessToken,
      },
    });
    if (debug) console.log(`RequestResponse is now:`, response.data);
    return response.data.result;
  } catch (error) {
    console.error("Error fetching Device Status:", error.message);
    throw error;
  }
}

// Função para obter os dados do dispositivo (token + status)
let cachedData = null;
let cacheTimestamp = null;
const CACHE_DURATION = 10 * 60 * 1000; // Cache válido por 10 minutos

async function fetchTuyaDataWithCache(deviceIds) {
  if (cachedData && cacheTimestamp && Date.now() - cacheTimestamp < CACHE_DURATION) {
    console.log("Retornando dados do cache.");
    return cachedData;
  }

  const accessToken = await getAccessToken();
  const deviceStatus = await getDeviceStatus(accessToken, deviceIds);

  cachedData = deviceStatus; // Atualiza o cache
  cacheTimestamp = Date.now(); // Atualiza o timestamp
  console.log("Dados atualizados no cache.");
  return cachedData;
}

// Função para extrair temperatura e umidade do status do dispositivo
function extractTemperatureAndHumidity(deviceStatus) {
  let temperature = null;
  let humidity = null;

  deviceStatus.forEach((device) => {
    device.status.forEach((item) => {
      if (item.code === 'va_temperature') {
        temperature = item.value / 10; // Normalizar para °C, se necessário
      } else if (item.code === 'va_humidity') {
        humidity = item.value / 10;
      }
    });
  });

  console.log("Temperatura:", JSON.stringify(temperature, null, 2));
  console.log("Humidade:", JSON.stringify(humidity, null, 2));

  if (temperature === null || humidity === null) {
    throw new Error('Não foi possível encontrar temperatura ou umidade no status do dispositivo.');
  }
  return { temperature, humidity };
}

// Exportações
module.exports = {
  getAccessToken,
  getDeviceStatus,
  fetchTuyaData,
  extractTemperatureAndHumidity,
};

// Apenas para testes manuais ou depuração, não necessário na execução contínua
if (debug) {
  (async function () {
    try {
      const deviceStatus = await fetchTuyaData(deviceIds);
      console.log("Device Status:", deviceStatus);

      const { temperature, humidity } = extractTemperatureAndHumidity(deviceStatus);
      console.log("Temperatura:", temperature, "Humidade:", humidity);
    } catch (error) {
      console.error("An error occurred:", error.message);
    }
  })();
}