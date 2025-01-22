const express = require("express");
const { getDeviceStatus, thermostatDeviceId, switchDeviceId } = require("./tuya");

const router = express.Router();

// Rota para obter status do termostato
router.get("/status/thermostat", async (req, res) => {
  try {
    const status = await getDeviceStatus(thermostatDeviceId);
    const temperature = status.find((item) => item.code === "va_temperature")?.value / 10 || null;
    const humidity = status.find((item) => item.code === "va_humidity")?.value / 10 || null;

    res.json({ success: true, temperature, humidity });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erro ao obter dados do termostato.", error: error.message });
  }
});

// Rota para obter status do interruptor
router.get("/status/switch", async (req, res) => {
  try {
    const status = await getDeviceStatus(switchDeviceId);
    const switchStatus = status.find((item) => item.code === "switch_1")?.value || false;

    res.json({ success: true, switchStatus });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erro ao obter dados do interruptor.", error: error.message });
  }
});

module.exports = router;
