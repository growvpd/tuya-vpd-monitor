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

    // Selecionar o canvas do gráfico
    const ctx = document.getElementById('vpdChart').getContext('2d');

    // Verifica se já existe um gráfico, destrói para recriar
    if (window.vpdChartInstance) {
      window.vpdChartInstance.destroy();
    }

    // Criar o novo gráfico com faixas de cores
    window.vpdChartInstance = new Chart(ctx, {
      type: 'line', // Tipo do gráfico
      data: {
        labels: labels, // Eixo X: tempo agrupado por 5 minutos
        datasets: [
          {
            label: 'VPD Médio por 5 Minutos',
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
        maintainAspectRatio: true, // Manter proporção adequada
        plugins: {
          title: {
            display: true,
            text: 'Gráfico de VPD Médio (Agregado por 5 Minutos)',
          },
          legend: {
            display: true,
          },
          annotation: {
            annotations: {
              // Propagation / Early Veg Stage
              greenZone: {
                type: 'box',
                xMin: 0, // O tempo é no eixo X, então deixamos a faixa global
                xMax: labels.length - 1,
                yMin: 0.4,
                yMax: 0.8,
                backgroundColor: 'rgba(0, 255, 0, 0.1)', // Verde claro
                borderWidth: 0,
              },
              // Late Veg / Early Flower Stage
              blueZone: {
                type: 'box',
                xMin: 0,
                xMax: labels.length - 1,
                yMin: 0.8,
                yMax: 1.2,
                backgroundColor: 'rgba(0, 0, 255, 0.1)', // Azul claro
                borderWidth: 0,
              },
              // Mid / Late Flower Stage
              purpleZone: {
                type: 'box',
                xMin: 0,
                xMax: labels.length - 1,
                yMin: 1.2,
                yMax: 1.6,
                backgroundColor: 'rgba(128, 0, 128, 0.1)', // Roxo claro
                borderWidth: 0,
              },
              // Danger Zone (acima de 1.6)
              redZone: {
                type: 'box',
                xMin: 0,
                xMax: labels.length - 1,
                yMin: 1.6,
                yMax: Math.max(...vpds) + 0.1, // Extende até o máximo do gráfico
                backgroundColor: 'rgba(255, 0, 0, 0.1)', // Vermelho claro
                borderWidth: 0,
              },
            },
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
      plugins: [
        {
          id: 'annotation', // Adiciona plugin para as faixas
        },
      ],
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
