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
  const tuyatime = `${Date.now()}`;
  const URL = "/v1.0/token?grant_type=1";
  const StringToSign = `${ClientID}${tuyatime}GET\n${EmptyBodyEncoded}\n\n${URL}`;
  const AccessTokenSign = generateSignature(StringToSign, ClientSecret);

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
    return response.data.result.access_token;
  } catch (error) {
    console.error("Error fetching Access Token:", error.message);
    throw error;
  }
}

// Obter status do dispositivo
async function getDeviceStatus(accessToken, deviceIds) {
  const tuyatime = `${Date.now()}`;
  const URL = `/v1.0/iot-03/devices/status?device_ids=${deviceIds}`;
  const StringToSign = `${ClientID}${accessToken}${tuyatime}GET\n${EmptyBodyEncoded}\n\n${URL}`;
  const RequestSign = generateSignature(StringToSign, ClientSecret);

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
    return response.data.result;
  } catch (error) {
    console.error("Error fetching Device Status:", error.message);
    throw error;
  }
}

// Exportações
module.exports = {
  ClientID,
  ClientSecret,
  getAccessToken,
  generateSignature,
  getDeviceStatus,
  BaseUrl,
  deviceIds,
};
