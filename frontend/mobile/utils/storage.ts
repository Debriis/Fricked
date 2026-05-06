import * as SecureStore from "expo-secure-store";

export const saveToken = (token: string) =>
    SecureStore.setItemAsync("academia_token", token);

export const getToken = () =>
    SecureStore.getItemAsync("academia_token");

export const clearToken = () =>
    SecureStore.deleteItemAsync("academia_token");
export const removeToken = () =>
    SecureStore.deleteItemAsync("academia_token");