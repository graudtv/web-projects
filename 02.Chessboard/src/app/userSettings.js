const eventListeners = {};
const currentSettings = {};

function localStorageTrySet(key, value) {
  try {
    localStorage.setItem(`settings-${key}`, value);
  } catch (error) {
    console.error(`Failed to save setting ${key}=${value} in localStorage:`, error);
  }
}

export const defaultSettings = {
  theme: 'dark',
  movement: 'both',
  boardTheme: 'blue',
  pieceSet: 'cburnett',
};

/* - Container of user settings
 * - Fetches settings from localStorage/defaultSettings if necessary
 * - Event listeners
 */
export const userSettings = {
  keys() {
    return defaultSettings.keys();
  },

  get(key) {
    if (!defaultSettings.hasOwnProperty(key))
      throw new Error(`invalid setting '${key}'`);
    if (!currentSettings.hasOwnProperty(key)) {
      let value = localStorage.getItem(`settings-${key}`);
      if (!value) {
        value = defaultSettings[key];
        localStorageTrySet(key, value);
      }
      currentSettings[key] = value;
    }
    return currentSettings[key]
  },

  set(key, value) {
    const prevValue = this.get(key);
    currentSettings[key] = value;
    localStorageTrySet(key, value);
    if (value != prevValue && eventListeners[key])
      eventListeners[key].forEach(listener => { listener(value); });
  },

  /* Reset all settings to default values */
  reset() {
    for (const key in defaultSettings)
      this.set(key, defaultSettings[key]);
  },

  onchange(key, listener) {
    if (!eventListeners[key])
      eventListeners[key] = []
    eventListeners[key].push(listener);
  },
};

