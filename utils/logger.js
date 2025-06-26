const fetch = require('node-fetch');

const LOG_API_URL = 'http://20.244.56.144/evaluation-service/logs';

const allowedStacks = ["backend", "frontend"];
const allowedLevels = ["debug", "info", "warn", "error"];
// Assuming a list of allowed packages might come from the constraints later, or be dynamic
const allowedPackages = ["handler", "database", "middleware", "routes"]; 

async function Log(stack, level, packageName, message) {
  const lowerStack = stack ? stack.toLowerCase() : '';
  const lowerLevel = level ? level.toLowerCase() : '';
  const lowerPackageName = packageName ? packageName.toLowerCase() : '';

  if (!allowedStacks.includes(lowerStack)) {
    console.warn(`Invalid stack: ${stack}. Must be one of ${allowedStacks.join(', ')}`);
    return;
  }

  if (!allowedLevels.includes(lowerLevel)) {
    console.warn(`Invalid level: ${level}. Must be one of ${allowedLevels.join(', ')}`);
    return;
  }

  if (!allowedPackages.includes(lowerPackageName)) {
    console.warn(`Invalid package: ${packageName}. Must be one of ${allowedPackages.join(', ')}`);
    return;
  }

  try {
    const response = await fetch(LOG_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        stack: lowerStack,
        level: lowerLevel,
        package: lowerPackageName,
        message,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      console.error(`Failed to send log: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error sending log:', error);
  }
}

module.exports = Log; 