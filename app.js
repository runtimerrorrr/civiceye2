// Default Hyderabad center
let map = L.map('map').setView([17.3850, 78.4867], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

let markers = [];
let selectedLat = 17.3850;
let selectedLng = 78.4867;

// Load reports from browser storage
let reports = JSON.parse(localStorage.getItem('hazards') || '[]');

// Demo data if first time
if (reports.length === 0) {
  reports = [
    { type: 'Pothole', severity: 'High', location: 'Banjara Hills, Road No. 12', desc: 'Deep pothole near bus stop', name: 'Ravi', lat: 17.4156, lng: 78.4347, status: 'Pending', votes: 12, date: new Date().toLocaleDateString(), photo: '' },
    { type: 'Waterlogging', severity: 'High', location: 'LB Nagar, Main Road', desc: 'Waterlogging after rain, traffic jam', name: 'Anonymous', lat: 17.3457, lng: 78.5522, status: 'Pending', votes: 23, date: new Date().toLocaleDateString(), photo: '' },
    { type: 'Open Manhole', severity: 'High', location: 'Kukatpally, Y Junction', desc: 'Open manhole, very dangerous at night', name: 'Priya', lat: 17.4849, lng: 78.4138, status: 'Verified', votes: 8, date: new Date().toLocaleDateString(), photo: '' }
  ];
  localStorage.setItem('hazards', JSON.stringify(reports));
}

function showTab(id) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  event.target.classList.add('active');
  if (id === 'mapTab') setTimeout(() => map.invalidateSize(), 200);
}

function renderAll() {
  // Clear markers
  markers.forEach(m => map.removeLayer(m));
  markers = [];
  let filter = document.getElementById('filterType').value;
  let filtered = reports.filter(r => filter === 'all' || r.type === filter);

  filtered.forEach((r, i) => {
    let color = r.severity === 'High' ? 'red' : r.severity === 'Medium' ? 'orange' : 'green';
    let marker = L.circleMarker([r.lat, r.lng], { color: color, radius: 10, fillOpacity: 0.8 }).addTo(map);
    marker.bindPopup(`<b>${r.type}</b> - ${r.severity}<br>${r.location}<br>Status: ${r.status}<br>👍 ${r.votes} votes`);
    markers.push(marker);
  });

  // Stats
  document.getElementById('totalCount').innerText = reports.length;
  document.getElementById('fixedCount').innerText = reports.filter(r => r.status === 'Fixed').length;
  document.getElementById('pendingCount').innerText = reports.filter(r => r.status !== 'Fixed').length;

  // List
  let listHtml = filtered.map((r, idx) => {
    let realIndex = reports.indexOf(r);
    return `<div class="card ${r.severity}">
      <h3>${r.type} • ${r.severity} Severity</h3>
      <p>📍 ${r.location}</p>
      <p>${r.desc || ''}</p>
      <p>👤 ${r.name} • 📅 ${r.date} • Status: <b>${r.status}</b> • 👍 ${r.votes}</p>
      ${r.photo ? `<img src="${r.photo}">` : ''}
      <br><button onclick="upvote(${realIndex})">👍 Still There / Upvote</button>
      <button onclick="markFixed(${realIndex})">✅ Mark Fixed</button>
    </div>`;
  }).join('') || '<p>No reports yet for this filter.</p>';
  document.getElementById('reportList').innerHTML = listHtml;
}

function useMyLocation() {
  if (!navigator.geolocation) { alert('Geolocation not supported'); return; }
  navigator.geolocation.getCurrentPosition(pos => {
    selectedLat = pos.coords.latitude;
    selectedLng = pos.coords.longitude;
    document.getElementById('latInput').value = selectedLat;
    document.getElementById('lngInput').value = selectedLng;
    document.getElementById('locStatus').innerText = `Location set: ${selectedLat.toFixed(4)}, ${selectedLng.toFixed(4)}`;
    map.setView([selectedLat, selectedLng], 15);
  });
}

function locateMe() { useMyLocation(); }

map.on('click', function(e) {
  selectedLat = e.latlng.lat;
  selectedLng = e.latlng.lng;
  document.getElementById('latInput').value = selectedLat;
  document.getElementById('lngInput').value = selectedLng;
  document.getElementById('locStatus').innerText = `Location picked from map: ${selectedLat.toFixed(4)}, ${selectedLng.toFixed(4)}`;
});

function submitReport(e) {
  e.preventDefault();
  let photoFile = document.getElementById('photoInput').files[0];
  let reader = new FileReader();
  reader.onload = function() { saveReport(reader.result); };
  if (photoFile) reader.readAsDataURL(photoFile);
  else saveReport('');
}

function saveReport(photoData) {
  let newReport = {
    type: document.getElementById('hazardType').value,
    severity: document.getElementById('severity').value,
    location: document.getElementById('locationName').value,
    desc: document.getElementById('description').value,
    name: document.getElementById('reporterName').value || 'Anonymous',
    lat: parseFloat(document.getElementById('latInput').value) || selectedLat,
    lng: parseFloat(document.getElementById('lngInput').value) || selectedLng,
    status: 'Pending',
    votes: 0,
    date: new Date().toLocaleDateString(),
    photo: photoData
  };
  reports.unshift(newReport);
  localStorage.setItem('hazards', JSON.stringify(reports));
  alert('Report submitted! Thank you for keeping Hyderabad safe.');
  document.getElementById('reportForm').reset();
  renderAll();
  showTab('mapTab');
  // Fix nav active state
  document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('nav button')[0].classList.add('active');
}

function upvote(i) {
  reports[i].votes++;
  localStorage.setItem('hazards', JSON.stringify(reports));
  renderAll();
}
function markFixed(i) {
  reports[i].status = 'Fixed';
  localStorage.setItem('hazards', JSON.stringify(reports));
  renderAll();
  alert('Marked as Fixed. Thanks!');
}

renderAll();
