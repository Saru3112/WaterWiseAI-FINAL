const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;

const sourceUrl = 'https://dams.kseb.in/?page_id=45';

const damCoordinates = {
  idukki: { latitude: 9.8436, longitude: 76.9762 },
  sholayar: { latitude: 10.3178, longitude: 76.7342 },
  anathode: { latitude: 9.341667, longitude: 77.15 },
  'banasura sagar': { latitude: 11.6709, longitude: 75.9504 },
  mattupetty: { latitude: 10.1063, longitude: 77.1238 },
  anayirankal: { latitude: 10.0095, longitude: 77.2072 },
  ponmudi: { latitude: 9.9604, longitude: 77.0565 },
  kakkayam: { latitude: 11.551, longitude: 75.925 },
  pamba: { latitude: 9.3906, longitude: 77.1598 },
  poringalkuthu: { latitude: 10.3152, longitude: 76.6344 },
  kundala: { latitude: 10.1436, longitude: 77.1986 },
  kallarkutty: { latitude: 9.98, longitude: 77.0014 },
  erattayar: { latitude: 9.8103, longitude: 77.106 },
  pambla: { latitude: 9.962, longitude: 76.9568 },
  moozhiyar: { latitude: 9.308, longitude: 77.0656 },
  kallar: { latitude: 9.8255, longitude: 77.1562 },
  chenkulam: { latitude: 10.0108, longitude: 77.0325 }
};

const Names = {
  'IDUKKI': 'Idukki',
  'SHOLAYAR': 'Sholayar',
  'KAKKI (ANATHODE )': 'Anathode',
  'BANASURASAGAR(K A SCHEME)': 'Banasura Sagar',
  'MADUPETTY': 'Mattupetty',
  'ANAYIRANKAL': 'Anayirankal',
  'PONMUDI': 'Ponmudi',
  'KUTTIYADI(KAKKAYAM)': 'Kakkayam',
  'PAMBA': 'Pamba',
  'PORINGALKUTHU': 'Poringalkuthu',
  'KUNDALA': 'Kundala',
  'KALLARKUTTY': 'Kallarkutty',
  'ERATTAYAR': 'Erattayar',
  'LOWER PERIYAR': 'Pambla',
  'MOOZHIYAR': 'Moozhiyar',
  'KALLAR': 'Kallar',
  'SENGULAM (PUMPING STORAGE DAM)': 'Chenkulam'
};

const convertFeetToMeters = (value) => {
  if (typeof value === 'string' && value.toLowerCase().includes('ft')) {
    const feet = parseFloat(value.replace(/[^\d.]/g, ''));
    return (feet * 0.3048).toFixed(2);
  }
  return value;
};

async function fetchDamData(url) {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const dams = [];

    $('table tr').slice(1).each((_, row) => {
      const columns = $(row).find('td');
      if (columns.length < 12) return;

      const damName = $(columns[1]).text().trim();
      const normalized = damName.toUpperCase();
      const displayName = Names[normalized];

      if (!displayName) return;

      const damKey = displayName.toLowerCase();
      const coord = damCoordinates[damKey] || {};

      const dam = {
        name: displayName,
        officialName: damName,
        FRL: convertFeetToMeters($(columns[3]).text().trim()),
        ruleLevel: convertFeetToMeters($(columns[4]).text().trim()),
        latitude: coord.latitude || null,
        longitude: coord.longitude || null,
        date: $('h1.entry-title').text().trim(),
        waterLevel: convertFeetToMeters($(columns[5]).text().trim()),
        storagePercent: $(columns[10]).text().trim(),
        inflow: $(columns[11]).text().trim()
      };

      dams.push(dam);
    });

    return { lastUpdate: dams[0]?.date || 'Unknown', dams };
  } catch (error) {
    console.error('❌ Error scraping dam data:', error.message);
    return { lastUpdate: 'Error', dams: [] };
  }
}

async function updateDamData() {
  const data = await fetchDamData(sourceUrl);
  await fs.writeFile('live.json', JSON.stringify(data, null, 4));
  console.log(`✅ Dam data updated. ${data.dams.length} entries written to live.json`);
}

updateDamData();
