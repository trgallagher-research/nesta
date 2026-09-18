// Clears map/ in the real database, for use between sessions or before a
// test run. Run with: npm run clear
const { clearMap } = require('../tests/db.js');

clearMap()
  .then(() => {
    console.log('map/ is now empty (null).');
  })
  .catch(err => {
    console.error('failed to clear map/: ' + err.message);
    process.exit(1);
  });
