// server/utils/cache.js
class Cache {
  constructor() {
    this.cache = new Map();
    this.ttl = 60 * 60 * 1000; // 60 minutes TTL
  }

  set(key, value, ttl = this.ttl) {
    this.cache.set(key, {
      data: value,
      expires: Date.now() + ttl
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  delete(key) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }
}

module.exports = new Cache();
