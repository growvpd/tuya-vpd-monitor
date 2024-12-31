// URLs do backend
const apiUrl = 'https://tuya-vpd-monitor.onrender.com/vpd/history';
const realTimeUrl = 'https://tuya-vpd-monitor.onrender.com/vpd';

// Função genérica para criar gráficos
async function createChart(chartId, dataKey, label, borderColor, backgroundColor, yTitle) {
  try {
    // Buscar dados do histórico
    const response = await fetch(apiUrl);
    const data = await response.json();

    // Verificar se há dados disponíveis
    if (!data || data.length === 0) {
      console.warn(`Nenhum dado disponível para o gráfico de ${label}.`);
      return;
    }

    // Processar os dados: ajustar para UTC-3
    const labels = data.map((item) => {
      const timestamp = new Date(
        item._id.year,
        item._id.month - 1,
        item._id.day,
        item._id.hour,
        item._id.minutes
      );
      const localTime = new Date(timestamp.getTime() - 3 * 60 * 60 * 1000);
      return localTime.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    });

    const datasetValues = data.map((item) => item[dataKey]);

    // Selecionar o canvas
    const canvas = document.getElementById(chartId);
    const ctx = canvas.getContext('2d');
    canvas.style.height = '400px';
    canvas.style.width = '100%';

    // Destruir gráfico existente se necessário
    if (window[`${chartId}Instance`]) {
      window[`${chartId}Instance`].destroy();
    }

    // Criar o gráfico
    window[`${chartId}Instance`] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: `${label} por 5 Minutos`,
            data: datasetValues,
            borderColor: borderColor,
            backgroundColor: backgroundColor,
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
            text: `Gráfico de ${label} (Agregado por 5 Minutos)`,
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
              text: yTitle,
            },
            min: 0,
            max: Math.max(...datasetValues) + 5, // Ajusta o eixo Y
          },
        },
      },
    });
  } catch (error) {
    console.error(`Erro ao buscar dados para o gráfico de ${label}:`, error);
  }
}

// Criar gráficos específicos
async function createVPDChart() {
  await createChart(
    'vpdChart',
    'avgVPD',
    'VPD Médio',
    'rgba(75, 192, 192, 1)',
    'rgba(75, 192, 192, 0.2)',
    'VPD (kPa)'
  );
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
      };
}

async function createTemperatureChart() {
  await createChart(
    'temperatureChart',
    'avgTemperature',
    'Temperatura Média',
    'rgba(255, 99, 132, 1)',
    'rgba(255, 99, 132, 0.2)',
    'Temperatura (°C)'
  );
}

async function createHumidityChart() {
  await createChart(
    'humidityChart',
    'avgHumidity',
    'Umidade Média',
    'rgba(54, 162, 235, 1)',
    'rgba(54, 162, 235, 0.2)',
    'Umidade (%)'
  );
}

// Exibir VPD em tempo real
async function showRealTimeVPD() {
  try {
    const response = await fetch(realTimeUrl);
    const data = await response.json();

    const vpdElement = document.getElementById('realTimeVPD');
    const vpdValue = parseFloat(data.vpd).toFixed(2);

    vpdElement.style.color =
      vpdValue < 0.4 || vpdValue > 1.6
        ? 'red'
        : vpdValue >= 0.4 && vpdValue < 0.8
        ? 'green'
        : vpdValue >= 0.8 && vpdValue < 1.2
        ? 'blue'
        : 'purple';

    vpdElement.innerHTML = `VPD Atual: ${vpdValue} kPa`;
  } catch (error) {
    console.error('Erro ao buscar VPD em tempo real:', error);
  }
}

// Inicializar gráficos
createVPDChart();
createTemperatureChart();
createHumidityChart();
showRealTimeVPD();

// Atualizar gráficos periodicamente
setInterval(createVPDChart, 300000); // Atualiza o gráfico de VPD
setInterval(createTemperatureChart, 300000); // Atualiza o gráfico de Temperatura
setInterval(createHumidityChart, 300000); // Atualiza o gráfico de Umidade
setInterval(showRealTimeVPD, 15000); // Atualiza o VPD em tempo real
