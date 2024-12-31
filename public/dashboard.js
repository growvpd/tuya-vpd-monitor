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
    const humidities = data.map((item) => item.avgHumidity); // Valores médios de umidade

    // Determinar a cor para cada ponto com base no valor do VPD
    const pointColorsVPD = vpds.map((vpd) => {
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

    // Configurar os gráficos
    const createGraph = (ctx, label, data, color, title) => {
      return new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: label,
              data: data,
              borderColor: color,
              backgroundColor: `${color}33`, // Fundo semitransparente
              borderWidth: 2,
              fill: true,
              tension: 0.4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: title,
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
                text: label,
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
    };

    // Selecionar os canvas
    const vpdCanvas = document.getElementById('vpdChart').getContext('2d');
    const tempCanvas = document.getElementById('tempChart').getContext('2d');
    const humidityCanvas = document.getElementById('humidityChart').getContext('2d');

    // Destruir gráficos existentes (se houver)
    if (window.vpdChartInstance) window.vpdChartInstance.destroy();
    if (window.tempChartInstance) window.tempChartInstance.destroy();
    if (window.humidityChartInstance) window.humidityChartInstance.destroy();

    // Criar novos gráficos
    window.vpdChartInstance = createGraph(
      vpdCanvas,
      'VPD (kPa)',
      vpds,
      'rgba(75, 192, 192, 1)',
      'Gráfico de VPD Médio (Agregado por 5 Minutos)'
    );
    window.tempChartInstance = createGraph(
      tempCanvas,
      'Temperatura (°C)',
      temperatures,
      'rgba(255, 99, 132, 1)',
      'Gráfico de Temperatura (°C)'
    );
    window.humidityChartInstance = createGraph(
      humidityCanvas,
      'Umidade (%)',
      humidities,
      'rgba(54, 162, 235, 1)',
      'Gráfico de Umidade (%)'
    );
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
