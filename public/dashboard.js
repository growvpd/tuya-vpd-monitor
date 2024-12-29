// URL do backend para buscar o histórico
const apiUrl = '/vpd/history';

// Função para criar o gráfico
async function createChart() {
  try {
    // Buscar dados do histórico no backend
    const response = await fetch(apiUrl);
    const data = await response.json();

    // Processar os dados
    const timestamps = data.map(item => new Date(item.timestamp).toLocaleString()); // Converte timestamps para formato legível
    const vpds = data.map(item => item.vpd); // Extrai os valores de VPD

    // Configurar o gráfico
    const ctx = document.getElementById('vpdChart').getContext('2d');
    new Chart(ctx, {
      type: 'line', // Tipo do gráfico
      data: {
        labels: timestamps, // Eixo X: tempo
        datasets: [
          {
            label: 'VPD ao longo do tempo',
            data: vpds, // Valores de VPD
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderWidth: 2,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Gráfico de VPD (Deficit de Pressão de Vapor)',
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

setInterval(createChart, 15000); // Atualiza o gráfico a cada 15 segundos
