const fs = require('fs').promises;
const path = require('path');

const ACTIVITY_PATH = path.join(__dirname, '..', '..', 'data', 'activity.json');

// Initialize activity log on startup
async function initializeActivity() {
  try {
    await fs.access(ACTIVITY_PATH);
  } catch (e) {
    if (e.code === 'ENOENT') {
      // Create empty activity log
      await writeActivity([]);
    } else {
      throw e;
    }
  }
}

// Read all activity logs
async function readActivity() {
  try {
    const data = await fs.readFile(ACTIVITY_PATH, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    if (e.code === 'ENOENT') return [];
    throw e;
  }
}

// Write activity logs to file
async function writeActivity(activities) {
  await fs.writeFile(ACTIVITY_PATH, JSON.stringify(activities, null, 2));
}

// Add new activity log entry
async function logActivity(username, activity) {
  const activities = await readActivity();
  const newEntry = {
    datetime: new Date().toISOString(),
    username,
    activity
  };
  
  activities.push(newEntry);
  await writeActivity(activities);
  
  return newEntry;
}

// Get activities with optional username prefix filter
async function getActivities(usernamePrefix = '') {
  const activities = await readActivity();
  
  if (!usernamePrefix) {
    return activities;
  }
  
  return activities.filter(activity => 
    activity.username.toLowerCase().startsWith(usernamePrefix.toLowerCase())
  );
}

module.exports = {
  initializeActivity,
  logActivity,
  getActivities
};
