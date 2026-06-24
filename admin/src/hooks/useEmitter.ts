// useEmitter.ts
import { useEffect } from "react";
import mitt, { type Emitter } from "mitt";
import type { UserLoginEvent } from "@/events/user.event";

type Events = {
  ["*"]: any;
  ["user.login"]: UserLoginEvent;
  ["user.logout"]: any;
};

export const emitter: Emitter<Events> = mitt<Events>();

export function useEmit() {
  return {
    emit: emitter.emit,
    on: emitter.on,
    off: emitter.off,
    once: (event: keyof Events, handler: any) => {
      const fn = (...args: any[]) => {
        handler(...args);
        emitter.off(event, fn);
      };
      emitter.on(event, fn);
    },
  };
}

export function useEvent<T extends keyof Events>(
  event: T,
  handler: (payload: Events[T]) => void,
) {
  useEffect(() => {
    emitter.on(event, handler);
    return () => emitter.off(event, handler);
  }, [event, handler]);
}
