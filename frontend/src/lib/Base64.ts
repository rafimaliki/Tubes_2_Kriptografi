export const Base64 = {
  encode: (data: string): string => {
    return btoa(data);
  },
  decode: (data: string): string => {
    return atob(data);
  },
};
