import * as SecureStore from "expo-secure-store";

// Session token (short-lived, from SRM)
export const saveToken = (token: string) =>
    SecureStore.setItemAsync("academia_token", token);

export const getToken = () =>
    SecureStore.getItemAsync("academia_token");

export const clearToken = () =>
    SecureStore.deleteItemAsync("academia_token");

export const removeToken = () =>
    SecureStore.deleteItemAsync("academia_token");

// Saved credentials for auto-login
export const saveCredentials = async (username: string, password: string) => {
    await SecureStore.setItemAsync("academia_username", username);
    await SecureStore.setItemAsync("academia_password", password);
};

export const getCredentials = async (): Promise<{ username: string; password: string } | null> => {
    const username = await SecureStore.getItemAsync("academia_username");
    const password = await SecureStore.getItemAsync("academia_password");
    if (username && password) return { username, password };
    return null;
};

export const clearCredentials = async () => {
    await SecureStore.deleteItemAsync("academia_username");
    await SecureStore.deleteItemAsync("academia_password");
};