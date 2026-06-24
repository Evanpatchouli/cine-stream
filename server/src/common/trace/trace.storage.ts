// src/common/trace/trace.storage.ts
import { AsyncLocalStorage } from 'async_hooks';

class TraceIdStorage {
  private storage = new AsyncLocalStorage<Map<string, any>>();

  run(initial: Record<string, any>, callback: (...args: any[]) => void) {
    const store = new Map(Object.entries(initial));
    this.storage.run(store, callback);
  }

  set(key: string, value: any) {
    const store = this.storage.getStore();
    if (store) store.set(key, value);
  }

  get(key: string): any {
    const store = this.storage.getStore();
    return store?.get(key);
  }
}

export const traceStorage = new TraceIdStorage();

export const getTraceId = () => traceStorage.get('traceId');
