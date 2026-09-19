// Shared helpers for talking to the real Firebase Realtime Database that
// index.html points at. No mocking: these hit the live database over https.

const fs = require('fs');
const path = require('path');

const INDEX_HTML_PATH = path.join(__dirname, '..', 'index.html');

// Reads the databaseURL out of index.html by regex on the FIREBASE_CONFIG
// literal, so the tests and the clear script always agree with the page.
function readDatabaseUrl() {
  const html = fs.readFileSync(INDEX_HTML_PATH, 'utf8');
  const match = html.match(/databaseURL:\s*"([^"]+)"/);
  if (!match) {
    throw new Error('could not find databaseURL in index.html');
  }
  return match[1];
}

// Deletes everything under map/ and archive/ in the database and waits for
// the deletes to be confirmed by a follow-up read.
async function clearMap() {
  const databaseUrl = readDatabaseUrl();
  for (const node of ['map', 'archive']) {
    const delResponse = await fetch(databaseUrl + '/' + node + '.json', { method: 'DELETE' });
    if (!delResponse.ok) {
      throw new Error('delete failed: ' + delResponse.status + ' ' + delResponse.statusText);
    }
    const getResponse = await fetch(databaseUrl + '/' + node + '.json');
    const value = await getResponse.json();
    if (value !== null) {
      throw new Error(node + '/ was not cleared, still holds: ' + JSON.stringify(value));
    }
  }
  return null;
}

module.exports = { readDatabaseUrl, clearMap };
