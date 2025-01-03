const axios = require("axios");

// URL do backend para buscar os dados de temperatura
const serverUrl = "https://tuya-vpd-monitor.onrender.com/vpd"; // Substitua pelo URL do servidor em produção

// Função para verificar a temperatura e controlar o AC
async function checkTemperatureAndControlAC() {
  try {
    // Fazer requisição ao servidor para obter a temperatura
    const response = await axios.get(`${serverUrl}`);
    const { temperature } = response.data;

    if (!temperature) {
      console.warn("Temperatura não encontrada no servidor.");
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

// Função para enviar comando ao dispositivo Tuya
async function sendCommandToDevice(state) {
  const deviceId = "ebf025fcebde746b5akmak"; // ID do dispositivo Tuya
  const accessToken = await getAccessToken();

  const tuyatime = `${Date.now()}`;
  const URL = `/v1.0/iot-03/devices/${deviceId}/commands`;
  const StringToSign = `${ClientID}${accessToken}${tuyatime}POST\n\n${URL}`;
  const RequestSign = generateSignature(StringToSign, ClientSecret);

  try {
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
    console.log(`Comando enviado para o dispositivo: ${state ? "Ligar" : "Desligar"}`);
  } catch (error) {
    console.error("Erro ao enviar comando para o dispositivo:", error.message);
  }
}

// Iniciar o controle do AC
setInterval(checkTemperatureAndControlAC, 15000); // Executa a cada 15 segundos

module.exports = { checkTemperatureAndControlAC };

