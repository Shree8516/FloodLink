// Demo data seed script. Run with `npm run seed` AFTER all backends are running.
// 1) Creates 3 users in MongoDB (citizen, volunteer, admin – password "demo123").
// 2) Posts 15 realistic Chennai flood requests THROUGH the real request-service API, so each one gets a real
//    insights analysis and a live broadcast. 3) Claims 5 of them and resolves 2, so the map shows all colours.
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../src/config');
const { User } = require('../src/models/User');
const { signToken } = require('../src/utils/token');

const DEMO_PASSWORD = 'demo123';
const REQUESTS_API = `${config.requestServiceUrl}/api/v1/requests`;

const DEMO_USERS = [
  { name: 'Kavya', email: 'citizen@floodlink.in', phone: '9000000001', role: 'CITIZEN' },
  { name: 'Priya', email: 'volunteer@floodlink.in', phone: '9000000002', role: 'VOLUNTEER' },
  { name: 'Admin', email: 'admin@floodlink.in', phone: '9000000003', role: 'ADMIN' },
];

// Addresses follow the "Street, Area" convention so stats and the ticker can show the area
const DEMO_REQUESTS = [
  ['RESCUE', 'Elderly couple trapped on first floor, water at chest level', 12.9815, 80.2180, 'Vijaya Nagar 3rd Street, Velachery', 2, 'Lakshmi', '9840012345'],
  ['FOOD', 'Apartment block with no food or drinking water since yesterday', 12.9772, 80.2209, 'Tansi Nagar, Velachery', 40, 'Divya', '9843045678'],
  ['MEDICINE', 'Dialysis patient cannot reach the hospital, needs transport', 12.9862, 80.2142, 'Bharathi Nagar, Velachery', 1, 'Hari', '9855067890'],
  ['RESCUE', 'Family with small child stuck on terrace, ground floor flooded', 12.9156, 80.0702, 'Varadharajapuram, Mudichur', 5, 'Senthil', '9841023456'],
  ['MEDICINE', 'Diabetic patient needs insulin, pharmacy closed', 12.9249, 80.1000, 'Shanmugam Road, Tambaram', 1, 'Ramesh', '9842034567'],
  ['SHELTER', 'Ground floor houses flooded, families sitting on the road', 12.9300, 80.1150, 'Kadaperi, Tambaram', 25, 'Selvi', '9848090123'],
  ['FOOD', 'Thirty people in community hall need food packets', 12.9349, 80.2137, 'Kamakoti Nagar, Pallikaranai', 30, 'Anitha', '9846078901'],
  ['SHELTER', 'Hut washed away, need a safe place for the night', 13.0012, 80.2565, 'Srinivasapuram, Adyar', 6, 'Murugan', '9844056789'],
  ['RESCUE', 'Pregnant woman needs to reach hospital, roads under water', 12.8996, 80.2063, 'Main Road, Perumbakkam', 2, 'Karthik', '9845067890'],
  ['MEDICINE', 'Child with high fever, need paracetamol and ORS', 13.0213, 80.2231, 'Jones Road, Saidapet', 1, 'Fathima', '9847089012'],
  ['RESCUE', 'Disabled man alone at home, cannot walk through the water', 12.8710, 80.2240, 'Housing Board, Semmencheri', 1, 'Vignesh', '9849001234'],
  ['FOOD', 'Milk needed for infants in the street', 13.0359, 80.2121, '11th Avenue, Ashok Nagar', 8, 'Meena', '9850012345'],
  ['MEDICINE', 'Oxygen cylinder running low for an elderly patient', 13.0405, 80.1990, 'Sector 6, KK Nagar', 1, 'Prakash', '9851023456'],
  ['SHELTER', 'Fishing families need relief camp after the river overflowed', 13.2146, 80.3203, 'Kuppam, Ennore', 18, 'Arumugam', '9852034567'],
  ['FOOD', 'Old age home residents have had no meals since morning', 13.0389, 80.2209, 'Lake View Road, West Mambalam', 22, 'Sister Mary', '9853045678'],
];

// Creates the user only if the email isn't taken yet, so the script can be run again safely
async function ensureUser(demoUser) {
  const existing = await User.findOne({ email: demoUser.email });
  if (existing) return existing;
  const password = await bcrypt.hash(DEMO_PASSWORD, 10);
  return User.create({ ...demoUser, password });
}

// Small fetch wrapper: sends the JWT and stops the script with a clear message if a call fails
async function callRequestService(method, url, token, body) {
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    throw new Error(`${method} ${url} failed with ${response.status}: ${await response.text()}`);
  }
  return response.json();
}

async function createDemoRequests(citizenToken) {
  const created = [];
  for (const [type, description, latitude, longitude, address, peopleCount, contactName, contactPhone] of DEMO_REQUESTS) {
    const body = { type, description, latitude, longitude, address, peopleCount, contactName, contactPhone };
    created.push(await callRequestService('POST', REQUESTS_API, citizenToken, body));
  }
  return created;
}

// Claims requests 4-8 and resolves the first two of those, so the map shows red, orange and green
async function claimAndResolveSome(requests, volunteerToken) {
  const toClaim = requests.slice(3, 8);
  for (const request of toClaim) {
    await callRequestService('POST', `${REQUESTS_API}/${request.id}/claim`, volunteerToken);
  }
  for (const request of toClaim.slice(0, 2)) {
    await callRequestService('POST', `${REQUESTS_API}/${request.id}/resolve`, volunteerToken);
  }
}

async function seed() {
  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 5000 });
  const users = [];
  for (const demoUser of DEMO_USERS) users.push(await ensureUser(demoUser));
  console.log(`[seed] Users ready: ${users.map((u) => u.email).join(', ')} (password: ${DEMO_PASSWORD})`);

  // The seed script belongs to the token-issuing service, so it may sign tokens directly
  const [citizenToken, volunteerToken, adminToken] = users.map(signToken);
  const existing = await callRequestService('GET', REQUESTS_API, adminToken);
  if (existing.length > 0) {
    console.log(`[seed] request-service already has ${existing.length} requests, skipping request seeding`);
    return;
  }
  const requests = await createDemoRequests(citizenToken);
  await claimAndResolveSome(requests, volunteerToken);
  console.log(`[seed] Created ${requests.length} requests (5 claimed, 2 of them resolved)`);
}

seed()
  .catch((error) => {
    console.error('[seed] Failed:', error.message);
    console.error('[seed] Are MongoDB, request-service (8080) and insights-service (5001) running?');
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
