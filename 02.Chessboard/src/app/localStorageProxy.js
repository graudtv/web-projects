const proxyData = new Map();

export default localStorageProxy = {
  setItem(key, value) {
    proxyData.set(key, value);
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error(error);
    }
  }
  getItem(key) {
    if (proxyData.has(key))
      return proxyData.get(key)
    return localStorage.getItem(key);
  }
}
