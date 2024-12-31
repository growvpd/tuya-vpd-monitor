// URL do backend para buscar o histórico e os dados em tempo real
const apiUrl = 'https://tuya-vpd-monitor.onrender.com/vpd/history';
const realTimeUrl = 'https://tuya-vpd-monitor.onrender.com/vpd'; // Para dados em tempo real

// Função para criar o gráfico de VPD
async function createVPDChart() {
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data || data.length === 0) {
      console.warn('Nenhum dado disponível para o gráfico de VPD.');
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
      return localTime.toLocaleTimeString('pt-BR'); // Exibir apenas o horário
    });

    const vpds = data.map((item) => item.avgVPD);

    const canvas = document.getElementById('vpdChart');
    const ctx = canvas.getContext('2d');
    canvas.style.height = '400px';
    canvas.style.width = '100%';

    if (window.vpdChartInstance) {
      window.vpdChartInstance.destroy();
    }

    window.vpdChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'VPD Médio por 5 Minutos',
            data: vpds,
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
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
            text: 'Gráfico de VPD Médio (Agregado por 5 Minutos)',
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
            max: Math.max(...vpds) + 0.2,
          },
        },
      },
    });
  } catch (error) {
    console.error('Erro ao buscar dados para o gráfico de VPD:', error);
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
          },
        },
      },
    });
  } catch (error) {
    console.error('Erro ao buscar dados para o gráfico de Umidade:', error);
  }
}

// Chamar as funções para criar os gráficos
createVPDChart();
createTemperatureChart();
createHumidityChart();

// Atualizar os gráficos periodicamente
setInterval(createVPDChart, 300000);
setInterval(createTemperatureChart, 300000);
setInterval(createHumidityChart, 300000);
