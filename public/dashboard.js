// URL do backend para buscar o histórico e os dados em tempo real
const apiUrl = 'https://tuya-vpd-monitor.onrender.com/vpd/history';
const realTimeUrl = 'https://tuya-vpd-monitor.onrender.com/vpd'; // Para dados em tempo real

// Função para criar os gráficos
async function createCharts() {
  try {
    // Buscar dados do histórico no backend
    const response = await fetch(apiUrl);
    const data = await response.json();

    // Verificar se há dados retornados
    if (!data || data.length === 0) {
      console.warn('Nenhum dado disponível para os gráficos.');
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
    const temperatures = data.map((item) => item.avgTemperature); // Valores médios de temperatura

    // Selecionar os canvas
    const vpdCanvas = document.getElementById('vpdChart').getContext('2d');
    const tempCanvas = document.getElementById('tempChart').getContext('2d');

    // Destruir gráficos existentes (se houver)
    if (window.vpdChartInstance) window.vpdChartInstance.destroy();
    if (window.tempChartInstance) window.tempChartInstance.destroy();

    // Criar o gráfico de VPD
    window.vpdChartInstance = new Chart(vpdCanvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'VPD Médio por 5 Minutos',
            data: vpds,
            borderColor: 'rgba(75, 192, 192, 1)', // Linha principal
            backgroundColor: 'rgba(75, 192, 192, 0.2)', // Fundo semitransparente
            borderWidth: 2,
            fill: true,
            tension: 0.4, // Suaviza a linha
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

    // Criar o gráfico de Temperatura
    window.tempChartInstance = new Chart(tempCanvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Temperatura (°C)',
            data: temperatures,
            borderColor: 'rgba(255, 99, 132, 1)', // Cor da linha
            backgroundColor: 'rgba(255, 99, 132, 0.2)', // Fundo semitransparente
            borderWidth: 2,
            fill: true,
            tension: 0.4, // Suaviza a linha
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Gráfico de Temperatura (°C)',
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

// Chamar as funções para criar os gráficos e mostrar o VPD em tempo real
createCharts();
showRealTimeVPD();

// Atualizar os gráficos e o VPD em tempo real periodicamente
setInterval(createCharts, 300000); // Atualiza os gráficos a cada 5 minutos (300000ms)
setInterval(showRealTimeVPD, 15000); // Atualiza o VPD em tempo real a cada 15 segundos
