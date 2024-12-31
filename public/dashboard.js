// URL do backend para buscar o histórico e os dados em tempo real
const apiUrl = 'https://tuya-vpd-monitor.onrender.com/vpd/history';
const realTimeUrl = 'https://tuya-vpd-monitor.onrender.com/vpd'; // Para dados em tempo real

// Função para criar o gráfico
async function createChart() {
  try {
    // Buscar dados do histórico no backend
    const response = await fetch(apiUrl);
    const data = await response.json();

    // Verificar se há dados retornados
    if (!data || data.length === 0) {
      console.warn('Nenhum dado disponível para o gráfico.');
      return;
    }

    // Processar os dados agregados: ajustar o horário para UTC-3
    const labels = data.map((item) => {
      const timestamp = new Date(
        item._id.year,
        item._id.month - 1,
        item._id.day,
        item._id.hour,
        item._id.minutes
      );

      // Ajustar o horário para UTC-3 (São Paulo)
      const localTime = new Date(timestamp.getTime() - 3 * 60 * 60 * 1000);

      return localTime.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }); // Exibir apenas hora:minutos:segundos no formato brasileiro
    });

    const vpds = data.map((item) => item.avgVPD); // Valores médios de VPD

    // Determinar a cor para cada ponto com base no valor do VPD
    const pointColors = vpds.map((vpd) => {
      if (vpd < 0.4 || vpd > 1.6) {
        return 'red'; // Danger Zone
      } else if (vpd >= 0.4 && vpd < 0.8) {
        return 'green'; // Propagation / Early Veg Stage
      } else if (vpd >= 0.8 && vpd < 1.2) {
        return 'blue'; // Late Veg / Early Flower Stage
      } else if (vpd >= 1.2 && vpd <= 1.6) {
        return 'purple'; // Mid / Late Flower Stage
      }
      return 'gray'; // Valor padrão
    });

    // Selecionar o canvas do gráfico
    const canvas = document.getElementById('vpdChart');
    const ctx = canvas.getContext('2d');

    // Configurar tamanho fixo para o canvas para evitar crescimento infinito
    canvas.style.height = '400px';
    canvas.style.maxHeight = '400px';

    // Verifica se já existe um gráfico, destrói para recriar
    if (window.vpdChartInstance) {
      window.vpdChartInstance.destroy();
    }

    // Criar o novo gráfico com pontos coloridos
    window.vpdChartInstance = new Chart(ctx, {
      type: 'line', // Tipo do gráfico
      data: {
        labels: labels, // Eixo X: tempo ajustado para UTC-3
        datasets: [
          {
            label: 'VPD Médio por 5 Minutos',
            data: vpds, // Valores médios de VPD
            borderColor: 'rgba(75, 192, 192, 1)', // Cor da linha
            backgroundColor: 'rgba(75, 192, 192, 0.2)', // Fundo da área
            borderWidth: 2,
            fill: true,
            tension: 0.4, // Suaviza a linha
            pointBackgroundColor: pointColors, // Cores dos pontos
            pointBorderColor: pointColors, // Borda dos pontos
            pointRadius: 5, // Tamanho dos pontos
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false, // Evita problemas de proporção
        plugins: {
          title: {
            display: true,
            text: 'Gráfico de VPD Médio (Agregado por 5 Minutos)',
          },
          legend: {
            display: true,
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Tempo',
            },
          },
          y: {
            title: {
              display: true,
              text: 'VPD (kPa)',
            },
            min: 0,
            max: Math.max(...vpds) + 0.2, // Ajusta para acomodar os valores
          },
        },
        layout: {
          padding: {
            top: 10,
            bottom: 10,
          },
        },
      },
    });

    // Adicionar a legenda abaixo do gráfico
    const legendContainer = document.getElementById('legendContainer');
    legendContainer.innerHTML = `
      <div style="text-align: center; margin-top: 10px;">
        <span style="color: green; font-weight: bold;">● Propagation / Early Veg Stage (0.4 - 0.8 kPa)</span> |
        <span style="color: blue; font-weight: bold;">● Late Veg / Early Flower Stage (0.8 - 1.2 kPa)</span> |
        <span style="color: purple; font-weight: bold;">● Mid / Late Flower Stage (1.2 - 1.6 kPa)</span> |
        <span style="color: red; font-weight: bold;">● Danger Zone (Abaixo de 0.4 ou Acima de 1.6 kPa)</span>
      </div>
    `;
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
  }
}

// Função para criar o gráfico de Temperatura
async function createTemperatureChart() {
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data || data.length === 0) {
      console.warn('Nenhum dado disponível para o gráfico de Temperatura.');
      return;
    }

    const labels = data.map((item) => {
      const timestamp = new Date(
        item._id.year,
        item._id.month - 1,
        item._id.day,
        item._id.hour,
        item._id.minutes
      );
      const localTime = new Date(timestamp.getTime() - 3 * 60 * 60 * 1000); // Ajustar para UTC-3
      return localTime.toLocaleTimeString('pt-BR');
    });

    const temperatures = data.map((item) => item.avgTemperature);

    const canvas = document.getElementById('temperatureChart');
    const ctx = canvas.getContext('2d');
    canvas.style.height = '400px';
    canvas.style.width = '100%';

    if (window.temperatureChartInstance) {
      window.temperatureChartInstance.destroy();
    }

    window.temperatureChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Temperatura Média por 5 Minutos',
            data: temperatures,
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Gráfico de Temperatura Média (Agregado por 5 Minutos)',
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Tempo',
            },
          },
          y: {
            title: {
              display: true,
              text: 'Temperatura (°C)',
            },
            min: 0,
            max: Math.max(...temperatures) + 5, // Ajuste de Temperatura máximo
          },
        },
      },
    });
  } catch (error) {
    console.error('Erro ao buscar dados para o gráfico de Temperatura:', error);
  }
}

// Função para criar o gráfico de Umidade
async function createHumidityChart() {
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data || data.length === 0) {
      console.warn('Nenhum dado disponível para o gráfico de Umidade.');
      return;
    }

    const labels = data.map((item) => {
      const timestamp = new Date(
        item._id.year,
        item._id.month - 1,
        item._id.day,
        item._id.hour,
        item._id.minutes
      );
      const localTime = new Date(timestamp.getTime() - 3 * 60 * 60 * 1000); // Ajustar para UTC-3
      return localTime.toLocaleTimeString('pt-BR');
    });

    const humidities = data.map((item) => item.avgHumidity);

    const canvas = document.getElementById('humidityChart');
    const ctx = canvas.getContext('2d');
    canvas.style.height = '400px';
    canvas.style.width = '100%';

    if (window.humidityChartInstance) {
      window.humidityChartInstance.destroy();
    }

    window.humidityChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Umidade Média por 5 Minutos',
            data: humidities,
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Gráfico de Umidade Média (Agregado por 5 Minutos)',
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Tempo',
            },
          },
          y: {
            title: {
              display: true,
              text: 'Umidade (%)',
            },
            min: 0,
            max: Math.max(...humidities) + 10, // Ajuste de Umidade máximo
          },
        },
      },
    });
  } catch (error) {
    console.error('Erro ao buscar dados para o gráfico de Umidade:', error);
  }
}

// Função para exibir o VPD em tempo real
async function showRealTimeVPD() {
  try {
    const response = await fetch(realTimeUrl);
    const data = await response.json();

    const vpdElement = document.getElementById('realTimeVPD');
    const vpdValue = parseFloat(data.vpd).toFixed(2);

    // Alterar o texto e cor baseado no valor do VPD
    if (vpdValue < 0.4 || vpdValue > 1.6) {
      vpdElement.style.color = 'red';
      vpdElement.innerHTML = `VPD Atual: ${vpdValue} kPa (Danger Zone)`;
    } else if (vpdValue >= 0.4 && vpdValue < 0.8) {
      vpdElement.style.color = 'green';
      vpdElement.innerHTML = `VPD Atual: ${vpdValue} kPa (Propagation / Early Veg Stage)`;
    } else if (vpdValue >= 0.8 && vpdValue < 1.2) {
      vpdElement.style.color = 'blue';
      vpdElement.innerHTML = `VPD Atual: ${vpdValue} kPa (Late Veg / Early Flower Stage)`;
    } else if (vpdValue >= 1.2 && vpdValue <= 1.6) {
      vpdElement.style.color = 'purple';
      vpdElement.innerHTML = `VPD Atual: ${vpdValue} kPa (Mid / Late Flower Stage)`;
    }
  } catch (error) {
    console.error('Erro ao buscar dados em tempo real:', error);
  }
}

// Chamar as funções para criar o gráfico e mostrar o VPD em tempo real
createChart();
showRealTimeVPD();

// Atualizar o gráfico e o VPD em tempo real periodicamente
setInterval(createChart, 300000); // Atualiza o gráfico a cada 5 minutos (300000ms)
setInterval(showRealTimeVPD, 15000); // Atualiza o VPD em tempo real a cada 15 segundos

// Função para atualizar os valores de temperatura, umidade e VPD
async function updateMetrics() {
  try {
    // Fetch dos dados em tempo real
    const response = await fetch(realTimeUrl);
    const data = await response.json();

    // Atualizar os valores na interface
    document.getElementById('currentTemperature').innerText = `${data.temperature} °C`;
    document.getElementById('currentHumidity').innerText = `${data.humidity} %`;
    document.getElementById('currentVPD').innerText = `${parseFloat(data.vpd).toFixed(2)} kPa`;
  } catch (error) {
    console.error('Erro ao buscar dados em tempo real:', error);
  }
}

// Atualizar as métricas a cada 15 segundos
updateMetrics();
setInterval(updateMetrics, 15000);
