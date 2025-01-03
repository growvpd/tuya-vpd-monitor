const axios = require("axios");
const crypto = require("crypto");

// Configurações da API Tuya
const debug = true;
const ClientID = "sjsmr9rtnsn8fgj7rrce";
const ClientSecret = "9bb34ec30170490eb03dd45532f1bf53";
const BaseUrl = "https://openapi.tuyaus.com";
const EmptyBodyEncoded = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

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

// Função para verificar a temperatura e controlar o AC
async function checkTemperatureAndControlAC() {
  try {
    // Fazer requisição ao servidor para obter a temperatura
    const serverUrl = "https://tuya-vpd-monitor.onrender.com/vpd"; // URL do backend
    const response = await axios.get(serverUrl);
    const { temperature } = response.data;

    if (!temperature) {
      console.warn("Temperatura não encontrada no servidor.");
      return;
    }

    console.log(`Temperatura Atual: ${temperature}°C`);

    // Controle do ar-condicionado
    if (temperature >= 30) {
      console.log("Temperatura alta. Ligando ar-condicionado.");
      await sendCommandToDevice(true); // Liga o ar-condicionado
    } else if (temperature < 27.6) {
      console.log("Temperatura baixa. Desligando ar-condicionado.");
      await sendCommandToDevice(false); // Desliga o ar-condicionado
    } else {
      console.log("Temperatura dentro do intervalo esperado.");
    }
  } catch (error) {
    console.error("Erro ao verificar temperatura e controlar AC:", error.message);
  }
}

// Função para enviar comando ao dispositivo Tuya
async function sendCommandToDevice(state) {
  try {
    const accessToken = await getAccessToken();
    const tuyatime = `${Date.now()}`;
    const URL = `/v1.0/iot-03/devices/${DeviceId}/commands`;
    const StringToSign = `${ClientID}${accessToken}${tuyatime}POST\n\n${URL}`;
    const RequestSign = generateSignature(StringToSign, ClientSecret);

    await axios.post(
      `${BaseUrl}${URL}`,
      {
        commands: [
          {
            code: "switch_1",
            value: state,
          },
        ],
      },
      {
        headers: {
          "sign_method": "HMAC-SHA256",
          "client_id": ClientID,
          t: tuyatime,
          mode: "cors",
          "Content-Type": "application/json",
          sign: RequestSign,
          "access_token": accessToken,
        },
      }
    );

    console.log(`Comando enviado para o dispositivo: ${state ? "Ligar" : "Desligar"}`);
  } catch (error) {
    console.error("Erro ao enviar comando para o dispositivo:", error.message);
  }
}

// Iniciar o controle do AC
setInterval(checkTemperatureAndControlAC, 15000); // Executa a cada 15 segundos

module.exports = { checkTemperatureAndControlAC };
