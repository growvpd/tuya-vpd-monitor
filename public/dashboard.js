// URL do backend para buscar o histórico e os dados em tempo real
const apiUrl = 'https://tuya-vpd-monitor.onrender.com/vpd/history';
const realTimeUrl = 'https://tuya-vpd-monitor.onrender.com/vpd'; // Para dados em tempo real

// Função genérica para criar gráficos
async function createChart(canvasId, label, yAxisLabel, dataKey, maxAdjustment, customOptions = {}) {
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data || data.length === 0) {
      console.warn(`Nenhum dado disponível para o gráfico de ${label}.`);
      return;
    }

    // Filtrar dados para exibir apenas os das últimas 12 horas
    const twelveHoursAgo = Date.now() - 12 * 60 * 60 * 1000;
    const filteredData = data.filter((item) => {
      const timestamp = new Date(
        item._id.year,
        item._id.month - 1,
        item._id.day,
        item._id.hour,
        item._id.minute || 0
      ).getTime();
      return timestamp >= twelveHoursAgo;
    });

    // Processar os dados agregados: ajustar o horário para UTC-3
    const labels = filteredData.map((item) => {
      try {
        if (
          !item._id.year ||
          !item._id.month ||
          !item._id.day ||
          !item._id.hour ||
          !item._id.minute
        ) {
          console.warn('Dados de data incompletos:', item._id);
          return 'Data Inválida';
        }

        const timestamp = new Date(
          item._id.year,
          item._id.month - 1,
          item._id.day,
          item._id.hour,
          item._id.minute
        );
        const localTime = new Date(timestamp.getTime() - 3 * 60 * 60 * 1000);
        return localTime.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        });
      } catch (error) {
        console.error('Erro ao processar data:', error);
        return 'Data Inválida';
      }
    });

    const chartData = filteredData.map((item) => item[dataKey]);
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');

    canvas.style.height = '400px';
    canvas.style.width = '100%';

    // Remover gráfico existente se já criado
    if (window[`${canvasId}Instance`]) {
      window[`${canvasId}Instance`].destroy();
    }
    const chartOptions = {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: `${label} por 5 Minutos`,
            data: chartData,
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderWidth: 0.4,
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            ...(canvasId === 'vpdChart' && {
              pointBackgroundColor: chartData.map((value) => {
                if (value < 0.4 || value > 1.6) return 'red';
                if (value >= 0.4 && value < 0.8) return 'green';
                if (value >= 0.8 && value < 1.2) return 'blue';
                if (value >= 1.2 && value <= 1.6) return 'purple';
                return 'gray';
              }),
            }),
            ...(canvasId === 'temperatureChart' && {
              pointBackgroundColor: chartData.map((value) => {
                if (value < 18 || value >= 29) return 'red';
                if (value >= 24 && value < 29) return 'green';
                if (value >= 18 && value <= 24) return 'purple';
                return 'gray';
              }),
            }),
            ...(canvasId === 'humidityChart' && {
              pointBackgroundColor: chartData.map((value) => {
                if (value < 35 || value > 80) return 'red';
                if (value >= 35 && value < 51) return 'purple';
                if (value >= 51 && value < 71) return 'blue';
                if (value >= 71 && value <= 80) return 'green';
              }),
            }),
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `Gráfico de ${label} (Últimas 12 Horas)`,
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
              text: yAxisLabel,
            },
            min: 0,
            max: Math.max(...chartData) + maxAdjustment,
          },
        },
        layout: {
          padding: {
            top: 10,
            bottom: 10,
          },
        },
        ...customOptions,
      },
    };

    // Criar o novo gráfico
    window[`${canvasId}Instance`] = new Chart(ctx, chartOptions);
  } catch (error) {
    console.error(`Erro ao buscar dados para o gráfico de ${label}:`, error);
  }
}
