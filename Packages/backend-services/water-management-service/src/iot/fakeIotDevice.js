const mqtt = require('mqtt');

// Connect to the same MQTT broker as your IoTService
const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
const client = mqtt.connect(brokerUrl, {
  clientId: `fake-device-${Date.now()}`
});

// When connected
client.on('connect', () => {
  console.log('✅ Fake IoT Device connected to broker');

  // Send data every 5 seconds
  setInterval(() => {
    // Example: water meter reading
    const data = {
      reading: Math.floor(Math.random() * 500),  // Random number
      timestamp: new Date().toISOString(),
      batteryLevel: Math.floor(Math.random() * 100),
      signalStrength: Math.floor(Math.random() * 100)
    };

    // Publish to the same topic IoTService is subscribed to
    client.publish('amc/water/meters/123/reading', JSON.stringify(data));
    console.log('📤 Sent meter data:', data);

  }, 5000);
});

// Handle errors
client.on('error', (err) => {
  console.error('❌ Fake device error:', err);
});
