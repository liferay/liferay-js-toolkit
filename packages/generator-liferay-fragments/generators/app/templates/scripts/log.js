const chalk = require('chalk');

function log(message) {
  if (process.env.NODE_ENV !== 'test') {
    console.log(chalk.green(message));
  }
}

function logIndent(message) {
  log(`  ${message}`);
}

function logNewLine(message) {
  if (process.env.NODE_ENV !== 'test') {
    console.log('');
    log(message);
  }
}

function logSecondary(message) {
  if (process.env.NODE_ENV !== 'test') {
    console.log(message);
  }
}

module.exports = {
  log,
  logIndent,
  logNewLine,
  logSecondary
};
