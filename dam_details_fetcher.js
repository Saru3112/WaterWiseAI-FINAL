const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');

// Static dam metadata
const damMeta = {
  'IDUKKI': { name: 'Idukki', lat: 9.8436, lon: 76.9762, district: 'Idukki', capacity: 1996 },
  'IDAMALAYAR': { name: 'Idamalayar', lat: 10.2219, lon: 76.7060, district: 'Ernakulam', capacity: 1010 },
  'SHOLAYAR': { name: 'Sholayar', lat: 10.3178, lon: 76.7342, district: 'Thrissur', capacity: 1530 },
  'MADUPETTY': { name: 'Mattupetty', lat: 10.1063, lon: 77.1238, district: 'Idukki', capacity: 55 },
  'ANAYIRANKAL': { name: 'Anayirankal', lat: 10.0095, lon: 77.2072, district: 'Idukki', capacity: 50 },
  'PONMUDI': { name: 'Ponmudi', lat: 9.9604, lon: 77.0565, district: 'Idukki', capacity: 42 },
  'KUTTIYADI (KAKKAYAM)': { name: 'Kakkayam', lat: 11.551, lon: 75.925, district: 'Kozhikode', capacity: 136 },
  'PAMBA': { name: 'Pamba', lat: 9.3906, lon: 77.1598, district: 'Pathanamthitta', capacity: 37 },
  'PORINGALKUTHU': { name: 'Poringalkuthu', lat: 10.3436, lon: 76.7438, district: 'Thrissur', capacity: 328 },
  'KALLARKUTTY': { name: 'Kallarkutty', lat: 9.98, lon: 77.0014, district: 'Idukki', capacity: 44 },
  'ERATTAYAR': { name: 'Erattayar', lat: 9.8103, lon: 77.106, district: 'Idukki', capacity: 65 },
  'LOWER PERIYAR': { name: 'Pambla', lat: 9.962, lon: 76.9568, district: 'Ernakulam', capacity: 23 },
  'MOOZHIYAR': { name: 'Moozhiyar', lat: 9.308, lon: 77.0656, district: 'Pathanamthitta', capacity: 90 },
  'KALLAR': { name: 'Kallar', lat: 9.8255, lon: 77.1562, district: 'Idukki', capacity: 14 },
  'SENGULAM': { name: 'Chenkulam', lat: 10.0108, lon: 77.0325, district: 'Idukki', capacity: 16 },
  'KAKKI (ANATHODE )': { name: 'Anathode', lat: 9.3417, lon: 77.15, district: 'Pathanamthitta', capacity: 446 },
  'BANASURASAGAR (K A S)': { name: 'Banasura Sagar', lat: 11.6709, lon: 75.9504, district: 'Wayanad', capacity: 209 },
  'KUNDALA': { name: 'Kundala', lat: 10.1436, lon: 77.1986, district: 'Idukki', capacity: 14 }
};

const mainPage = 'https://dams.kseb.in/?page_id=45';

// Convert feet to meters
const convertFeet = val => {
  const feet = parseFloat(val.replace(/[^\d.]/g, ''));
  return isNaN(feet) ? null : +(feet * 0.3048).toFixed(2);
};

// Get latest data post URL
async function getLatestPostURL() {
  const res = await axios.get(mainPage);
  const $ = cheerio.load(res.data);
  const post = $('.elementor-post').first();
  const link = post.find('.elementor-post__title a').attr('href');
  return link;
}

// Extract dam data from post
async function fetchDamData(postUrl) {
  const res = await axios.get(postUrl);
  const $ = cheerio.load(res.data);
  const date = $('h1.entry-title').text().trim();

  const dams = [];

  $('table tr').slice(1).each((_, row) => {
    const td = $(row).find('td');
    if (td.length < 14) return;

    const rawName = $(td[1]).text().trim().toUpperCase();
    const damInfo = damMeta[rawName];
    if (!damInfo) return;

    dams.push({
      name: damInfo.name,
      date: date || new Date().toISOString().split('T')[0],
      level: convertFeet($(td[5]).text()),
      inflow: parseFloat($(td[11]).text()) || null,
      outflow: parseFloat($(td[12]).text()) || null,
      rainfall: parseFloat($(td[13]).text()) || null,
      status: $(td[9]).text().trim() || "Normal",
      frl: convertFeet($(td[3]).text()),
      mwl: convertFeet($(td[4]).text()),
      lat: damInfo.lat,
      lon: damInfo.lon,
      district: damInfo.district,
      capacity: damInfo.capacity
    });
  });

  return { lastUpdate: date, dams };
}

// Main execution function
async function updateDamData() {
  try {
    const url = await getLatestPostURL();
    const data = await fetchDamData(url);

    const backendLivePath = path.resolve(__dirname, './live.json');       // full object
    const frontendLivePath = path.resolve(__dirname, '../live.json');     // flat array

    // Save full object for backend
    await fs.writeFile(backendLivePath, JSON.stringify(data, null, 2));

    // Save only dam array for frontend
    await fs.writeFile(frontendLivePath, JSON.stringify(data.dams, null, 2));

    console.log(`✅ Dam data written successfully:
  📁 Backend: ${backendLivePath}
  📁 Frontend: ${frontendLivePath}
  📊 Total dams: ${data.dams.length}
  🗓️ Date: ${data.lastUpdate}`);
  } catch (err) {
    console.error("❌ Error during update:", err);
  }
}

updateDamData();
