const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');1
const mongoose = require('mongoose');
const path = require('path');
const { fetchTuyaData, extractTemperatureAndHumidity } = require('./tuya');

const app = express();
const PORT = 3000; // Porta onde o servidor vai rodar

// Configuração do MongoDB

require('dotenv').config(); // Certifique-se de ter instalado dotenv (npm install dotenv)

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Conectado ao MongoDB!'))
  .catch(err => console.error('Erro ao conectar ao MongoDB:', err));

// Esquema e Modelo para armazenar dados de VPD
const VPDData = mongoose.model('VPDData', new mongoose.Schema({
  temperature: Number,
  humidity: Number,
  vpd: Number,
  timestamp: { type: Date, default: Date.now },
}));

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Servir arquivos estáticos na pasta "public"
app.use(express.static(path.join(__dirname, '../public')));

// Rota para acessar o gráfico
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Rota para consultar o histórico
app.get('/vpd/history', async (req, res) => {
  try {
    const history = await VPDData.find().sort({ timestamp: -1 });
    res.json(history);
  } catch (error) {
    console.error('Erro ao buscar histórico:', error.message);
    res.status(500).json({ error: 'Erro ao buscar histórico.' });
  }
});

// Função para calcular o VPD
function calculateVPD(temperature, humidity) {
  const svp = 0.6108 * Math.exp((17.27 * temperature) / (temperature + 237.3)); // Pressão de vapor saturada (kPa)
  const avp = (humidity / 100) * svp; // Pressão de vapor atual (kPa)
  return svp - avp; // VPD
}

// Endpoint para consultar o VPD em tempo real
app.get('/vpd', async (req, res) => {
  try {
    const deviceIds = 'eb8faf00e42469ffaahezh'; // Substitua pelo ID do dispositivo
    const deviceStatus = await fetchTuyaData(deviceIds);

    // Extrair temperatura e umidade
    const { temperature, humidity } = extractTemperatureAndHumidity(deviceStatus);

    // Calcular o VPD
    const vpd = calculateVPD(temperature, humidity);

    // Retornar os dados no formato JSON
    res.json({
      temperature,
      humidity,
      vpd: vpd.toFixed(2),
    });
  } catch (error) {
    console.error('Erro ao consultar VPD:', error.message);
    res.status(500).json({ error: 'Erro ao obter dados.' });
  }
});

// Função para salvar os dados a cada 15 segundos
async function saveVPDData() {
  try {
    const deviceIds = 'eb8faf00e42469ffaahezh'; // Substitua pelo ID do dispositivo
    const deviceStatus = await fetchTuyaData(deviceIds);

    // Extrair temperatura e umidade
    const { temperature, humidity } = extractTemperatureAndHumidity(deviceStatus);

    // Calcular o VPD
    const vpd = calculateVPD(temperature, humidity);

    // Salvar no banco
    await new VPDData({ temperature, humidity, vpd }).save();
    console.log(`Dados salvos: Temperatura: ${temperature}, Umidade: ${humidity}, VPD: ${vpd.toFixed(2)}`);
  } catch (error) {
    console.error('Erro ao salvar dados:', error.message);
  }
}

// Configura o intervalo de 15 segundos
setInterval(saveVPDData, 15000);

// Inicia o servidor (apenas uma vez)
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

