import { Base64 } from "./Base64";

export const LocalStorage = {
  load: (local_storage_key: string): Object | null => {
    const data = localStorage.getItem(local_storage_key);
    if (data) {
      try {
        const decodedData = Base64.decode(data);
        return JSON.parse(decodedData);
      } catch {
        console.error("Failed to parse or decode localStorage data");
      }
    }
    return null;
  },
  save: (local_storage_key: string, object: Object | null): void => {
    if (object) {
      const encodedData = Base64.encode(JSON.stringify(object));
      localStorage.setItem(local_storage_key, encodedData);
    } else {
      localStorage.removeItem(local_storage_key);
    }
  },
  deleteAll: (): void => {
    localStorage.clear();
  },
};
