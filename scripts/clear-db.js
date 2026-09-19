// Clears map/ and archive/ in the real database, for use between sessions
// or before a test run. Run with: npm run clear
const { clearMap } = require('../tests/db.js');

clearMap()
  .then(() => {
    console.log('map/ and archive/ are now empty (null).');
  })
  .catch(err => {
    console.error('failed to clear map/ and archive/: ' + err.message);
    process.exit(1);
  });
