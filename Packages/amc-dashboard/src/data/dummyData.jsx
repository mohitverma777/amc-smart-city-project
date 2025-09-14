// src/data/dummyData.js
export const cityData = {
  alerts: [
    "🚧 Roadblock reported near Ring Road",
    "🚗 Heavy congestion at City Center",
    "⚠️ Accident reported on SG Highway",
    "🛑 Signal failure at Nehru Bridge",
    "🚙 Slow traffic near Airport Circle",
  ],
  trafficCameras: [
    { id: 1, name: "CG Road", imgSeed: 101 },
    { id: 2, name: "Ashram Road", imgSeed: 102 },
    { id: 3, name: "SG Highway", imgSeed: 103 },
    { id: 4, name: "Maninagar", imgSeed: 104 },
    { id: 5, name: "Naroda", imgSeed: 105 },
    { id: 6, name: "Vastrapur", imgSeed: 106 },
  ],
  heatmapPoints: [
    { lat: 23.0225, lng: 72.5714, intensity: 0.9 }, // CG Road
    { lat: 23.0300, lng: 72.5800, intensity: 0.7 }, // Ashram Road
    { lat: 23.0500, lng: 72.5300, intensity: 0.6 }, // SG Highway
    { lat: 23.0000, lng: 72.6000, intensity: 0.4 }, // Maninagar
    { lat: 23.0600, lng: 72.6500, intensity: 0.5 }, // Naroda
  ],
  utilities: {
    water: [
      { zone: "Vastrapur", level: 80 },
      { zone: "Paldi", level: 60 },
      { zone: "Maninagar", level: 30 },
    ],
    power: [
      { zone: "CG Road", status: "ok" },
      { zone: "Ashram Road", status: "outage" },
      { zone: "SG Highway", status: "ok" },
    ],
    waste: [
      { zone: "Vastrapur", fill: 40 },
      { zone: "Paldi", fill: 90 },
      { zone: "Maninagar", fill: 20 },
    ],
    streetlights: [
      { zone: "CG Road", working: 95, total: 100 },
      { zone: "Ashram Road", working: 80, total: 100 },
      { zone: "SG Highway", working: 100, total: 100 },
    ],
  },
};
