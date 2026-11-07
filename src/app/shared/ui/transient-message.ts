import { DestroyRef, inject, signal, WritableSignal } from '@angular/core';

/** Señal de aviso que se limpia cinco segundos después de su última actualización. */
export function transientMessage<T>(empty: T): WritableSignal<T> {
  const state = signal<T>(empty);
  const setValue = state.set.bind(state);
  let timer: ReturnType<typeof setTimeout> | undefined;

  state.set = value => {
    clearTimeout(timer);
    setValue(value);
    if (!Object.is(value, empty)) timer = setTimeout(() => setValue(empty), 5000);
  };
  state.update = update => state.set(update(state()));
  inject(DestroyRef).onDestroy(() => clearTimeout(timer));
  return state;
}
