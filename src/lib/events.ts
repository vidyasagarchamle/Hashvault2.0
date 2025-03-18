/**
 * Simple event management system for components that need to communicate
 * without prop drilling or context providers
 */

export class EventEmitter {
  private listeners: Record<string, (() => void)[]> = {};

  addEventListener(event: string, callback: () => void) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  removeEventListener(event: string, callback: () => void) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  dispatchEvent(event: string) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(callback => callback());
  }
}

// Create event emitter for storage updates
export const STORAGE_UPDATED = 'storage_updated';
export const storageUpdateEvent = new EventEmitter(); 