// URL do backend para buscar o histórico
const apiUrl = 'https://tuya-vpd-monitor.onrender.com/vpd/history';

// Função para criar o gráfico
async function createChart() {
  try {
    // Buscar dados do histórico no backend
    const response = await fetch(apiUrl);
    const data = await response.json();

    // Processar os dados agregados
    const labels = data.map(
      (item) => `${item._id.day}/${item._id.month} ${item._id.hour}:00`
    ); // Converte os dados de agrupamento para formato legível
    const vpds = data.map((item) => item.avgVPD); // Valores médios de VPD

    // Configurar o gráfico
    const ctx = document.getElementById('vpdChart').getContext('2d');
    new Chart(ctx, {
      type: 'line', // Tipo do gráfico
      data: {
        labels: labels, // Eixo X: tempo agregado por hora
        datasets: [
          {
            label: 'VPD Médio por Hora',
            data: vpds, // Valores médios de VPD
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderWidth: 2,
            fill: true,
            tension: 0.4, // Suaviza a linha
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Gráfico de VPD Médio (Agregado por Hora)',
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Hora do Dia',
            },
          },
          y: {
            title: {
              display: true,
              text: 'VPD Médio (kPa)',
            },
          },
        },
      },
    });
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
  }
}

// Chamar a função para criar o gráfico
createChart();

// Atualiza o gráfico a cada 15 minutos para refletir novos dados no backend
setInterval(createChart, 900000); // Atualização a cada 15 minutos (900000ms)
