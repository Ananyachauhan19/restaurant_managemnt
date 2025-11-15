// Simple shared flag to indicate exports in progress for a filename
const flags = {};

function setExportInProgress(filename, value = true) {
  flags[filename] = value;
}

function isExportInProgress(filename) {
  return !!flags[filename];
}

function clearExportFlag(filename) {
  delete flags[filename];
}

module.exports = { setExportInProgress, isExportInProgress, clearExportFlag };
