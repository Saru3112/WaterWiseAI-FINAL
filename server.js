const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// Serve frontend files
app.use(express.static(path.join(__dirname, '../')));

// POST endpoint for sensor data
app.post('/update-sensor', (req, res) => {
  const sensorData = req.body;
  const sensorPath = path.join(__dirname, '../sensor/sensor-data.json');

  fs.writeFile(sensorPath, JSON.stringify(sensorData, null, 2), err => {
    if (err) {
      console.error("❌ Failed to save sensor data:", err);
      return res.status(500).send("Error saving data");
    }
    console.log("✅ Sensor data updated:", sensorData);
    res.send("Sensor data received");
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
