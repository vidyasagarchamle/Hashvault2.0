/**
 * Simple event management system for components that need to communicate
 * without prop drilling or context providers
 */

export class EventEmitter {
  private listeners: Record<string, (() => void)[]> = {};

  constructor(public readonly eventName: string) {}

  public addEventListener(callback: () => void): () => void {
    if (!this.listeners[this.eventName]) {
      this.listeners[this.eventName] = [];
    }
    
    this.listeners[this.eventName].push(callback);
    
    // Return a function to remove this listener
    return () => {
      this.listeners[this.eventName] = this.listeners[this.eventName]
        .filter(listener => listener !== callback);
    };
  }

  public dispatchEvent(): void {
    if (!this.listeners[this.eventName]) return;
    
    for (const callback of this.listeners[this.eventName]) {
      callback();
    }
  }
}

// Predefined events
export const storageUpdateEvent = new EventEmitter('storage-updated'); 