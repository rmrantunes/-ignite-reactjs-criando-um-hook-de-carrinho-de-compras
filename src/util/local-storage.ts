export function saveToLocalStorage(key: string, value: any) {
  window.localStorage.setItem(key, JSON.stringify(value));
}
