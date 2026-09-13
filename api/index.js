// Vercel's Node.js runtime treats this file's export as a request handler.
// An Express app is already callable as (req, res), so exporting it
// directly works — combined with the rewrite in vercel.json that sends
// every path to this one function, letting Express's own router (in
// app.js) dispatch to the right route exactly as it does locally.
module.exports = require('../app');
