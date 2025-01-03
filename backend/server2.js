const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const { fetchTuyaData, sendTuyaCommand } = require('./tuya'); // Adiciona `sendTuyaCommand`

const app = express();
const PORT = 3000; // Porta onde o servidor vai rodar

// Configuração do MongoDB
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI, {})
  .then(() => console.log('Conectado ao MongoDB!'))
  .catch(err => console.error('Erro ao conectar ao MongoDB:', err));

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Servir arquivos estáticos na pasta "public"
app.use(express.static(path.join(__dirname, '../public')));

// Página principal do controle do ar-condicionado
app.get('/ac-control', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'ac-control.html'));
});

// Endpoint para controlar o ar-condicionado
app.post('/ac-control', async (req, res) => {
  try {
    const { action, temperature } = req.body; // Recebe "ligar", "desligar" e "temperatura"
    const deviceId = 'ebf025fcebde746b5akmak'; // ID do dispositivo Tuya

    // Enviar comando para o dispositivo
    if (action === 'ligar') {
      await sendTuyaCommand(deviceId, 'switch', true); // Liga o ar-condicionado
      if (temperature) {
        await sendTuyaCommand(deviceId, 'temp_set', parseInt(temperature, 10)); // Configura a temperatura
      }
    } else if (action === 'desligar') {
      await sendTuyaCommand(deviceId, 'switch', false); // Desliga o ar-condicionado
    }

    res.json({ success: true, message: 'Comando enviado com sucesso!' });
  } catch (error) {
    console.error('Erro ao controlar o ar-condicionado:', error.message);
    res.status(500).json({ error: 'Erro ao controlar o ar-condicionado.' });
  }
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
