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
        labels: labels, // Eixo X: tempo agrupado por 5 minutos
        datasets: [
          {
            label: 'VPD Médio por 5 Minutos',
            data: vpds, // Valores médios de VPD
            borderColor: 'rgba(75, 192, 192, 1)', // Linha principal
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
            max: Math.max(...vpds) + 0.2, // Ajusta para acomodar faixas
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
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
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
      // Danger Zone
      vpdElement.style.color = 'red';
      vpdElement.innerHTML = `VPD Atual: ${vpdValue} kPa (Danger Zone)`;
    } else if (vpdValue >= 0.4 && vpdValue < 0.8) {
      // Propagation / Early Veg Stage
      vpdElement.style.color = 'green';
      vpdElement.innerHTML = `VPD Atual: ${vpdValue} kPa (Propagation / Early Veg Stage)`;
    } else if (vpdValue >= 0.8 && vpdValue < 1.2) {
      // Late Veg / Early Flower Stage
      vpdElement.style.color = 'blue';
      vpdElement.innerHTML = `VPD Atual: ${vpdValue} kPa (Late Veg / Early Flower Stage)`;
    } else if (vpdValue >= 1.2 && vpdValue <= 1.6) {
      // Mid / Late Flower Stage
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

// Atualiza o gráfico a cada 5 minutos e o VPD em tempo real a cada 15 segundos
setInterval(createChart, 300000); // Atualiza o gráfico a cada 5 minutos (300000ms)
setInterval(showRealTimeVPD, 15000); // Atualiza o VPD em tempo real a cada 15 segundos
