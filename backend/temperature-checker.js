const axios = require("axios");
const crypto = require("crypto");

// Configurações básicas da Tuya
const ClientID = "sjsmr9rtnsn8fgj7rrce";
const ClientSecret = "9bb34ec30170490eb03dd45532f1bf53";
const BaseUrl = "https://openapi.tuyaus.com";
const DeviceId = "ebf025fcebde746b5akmak"; // ID do dispositivo
const debug = true; // Ativar logs para depuração

// Função para gerar assinatura HMAC-SHA256
function generateSignature(stringToSign, secret) {
  return crypto
    .createHmac("sha256", secret)
    .update(stringToSign)
    .digest("hex")
    .toUpperCase();
}

// Obter token de acesso
async function getAccessToken() {
  const tuyatime = `${Date.now()}`; // Timestamp da requisição
  const URL = "/v1.0/token?grant_type=1";
  const EmptyBodyEncoded =
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
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
    if (debug) console.log("AccessToken Response:", response.data);
    return response.data.result.access_token;
  } catch (error) {
    console.error("Erro ao obter token de acesso:", error.message);
    throw error;
  }
}

// Enviar comando para ligar/desligar o ar-condicionado
async function sendCommandToDevice(command) {
  const accessToken = await getAccessToken();
  const tuyatime = `${Date.now()}`;
  const URL = `/v1.0/iot-03/devices/${DeviceId}/commands`;
  const StringToSign = `${ClientID}${accessToken}${tuyatime}POST\n\n${URL}`;
  const RequestSign = generateSignature(StringToSign, ClientSecret);

  try {
    const response = await axios.post(
      `${BaseUrl}${URL}`,
      {
        commands: [
          {
            code: "switch_1", // Código para ligar/desligar
            value: command, // true para ligar, false para desligar
          },
        ],
      },
      {
        headers: {
          sign_method: "HMAC-SHA256",
          client_id: ClientID,
          t: tuyatime,
          mode: "cors",
          "Content-Type": "application/json",
          sign: RequestSign,
          access_token: accessToken,
        },
      }
    );

    if (debug) console.log("Comando enviado:", response.data);
  } catch (error) {
    console.error("Erro ao enviar comando:", error.message);
  }
}

// Função para verificar a temperatura e controlar o ar-condicionado
async function checkTemperatureAndControlAC() {
    try {
      // Buscar temperatura do backend
      const response = await axios.get(BackendUrl);
      const { temperature } = response.data;
  
      if (!temperature) {
        console.warn("Temperatura não encontrada no backend.");
        return;
      }
  
      console.log(`Temperatura Atual: ${temperature}°C`);
  
      // Controle do ar-condicionado
      if (temperature >= 28) {
        console.log("Temperatura alta. Ligando ar-condicionado.");
        await sendCommandToDevice(true); // Liga o ar-condicionado
      } else if (temperature < 27) {
        console.log("Temperatura baixa. Desligando ar-condicionado.");
        await sendCommandToDevice(false); // Desliga o ar-condicionado
      } else {
        console.log("Temperatura dentro do intervalo esperado.");
      }
    } catch (error) {
      console.error("Erro ao verificar temperatura e controlar AC:", error.message);
    }
  }


  async function startTemperatureChecker() {
    setInterval(async () => {
      await checkTemperatureAndControlAC(); // Certifique-se de que esta função já existe
    }, 15000); // Rodar a cada 15 segundos
  }
  
  module.exports = startTemperatureChecker;