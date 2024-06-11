const fs = require('fs');
const path = require('path');
if (fs.existsSync(path.resolve(__dirname, '.env')))
  require('dotenv').config();
  
module.exports = {
  PORT: process.env.PORT || 8007,
  SELF_URL: process.env.SELF_URL || "https://railmount.brandroid.org/"
}


