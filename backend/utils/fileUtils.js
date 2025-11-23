const fs = require('fs');

function cleanupFile(filePath) {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

module.exports = {
  cleanupFile
};
