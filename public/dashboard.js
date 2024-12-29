// URL do backend para buscar o histórico
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

    // Processar os dados agregados
    const labels = data.map(
      (item) =>
        `${item._id.day}/${item._id.month} ${item._id.hour}:${String(
          item._id.minutes
        ).padStart(2, '0')}`
    ); // Formata data e hora para 5 minutos
    const vpds = data.map((item) => item.avgVPD); // Valores médios de VPD

    // Configurar o gráfico
    const ctx = document.getElementById('vpdChart').getContext('2d');

    // Verifica se já existe um gráfico, destrói para recriar
    if (window.vpdChartInstance) {
      window.vpdChartInstance.destroy();
    }

    new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'VPD Médio por 5 Minutos',
          data: vpds,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false, // Permite ajustar o gráfico para o tamanho do container
        plugins: {
          title: {
            display: true,
            text: 'Gráfico de VPD Médio (Agregado por 5 Minutos)'
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Tempo'
            }
          },
          y: {
            title: {
              display: true,
              text: 'VPD (kPa)'
            },
            beginAtZero: true // Garante que o gráfico comece no zero
          }
        }
      }
    });
    
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
  }
}

// Função para exibir o VPD em tempo real
async function showRealTimeVPD() {
  try {
    const response = await fetch(realTimeUrl);
    const data = await response.json();

    // Verificar se os dados de VPD são válidos
    if (!data || typeof data.vpd === 'undefined') {
      console.warn('Dados de VPD em tempo real não disponíveis.');
      return;
    }

    // Atualizar o valor no elemento HTML
    const vpdElement = document.getElementById('realTimeVPD');
    vpdElement.innerHTML = `VPD Atual: ${parseFloat(data.vpd).toFixed(2)} kPa`;
  } catch (error) {
    console.error('Erro ao buscar dados em tempo real:', error);
  }
}

// Chamar as funções para criar o gráfico e mostrar o VPD em tempo real
createChart();
showRealTimeVPD();

// Atualiza o gráfico a cada 5 minutos e o VPD em tempo real a cada 15 segundos
setInterval(createChart, 300000); // Atualiza o gráfico a cada 5 minutos (300000ms)
setInterval(showRealTimeVPD, 15000); // Atualiza o VPD em tempo real a cada 15 segundos
