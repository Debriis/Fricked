import axios from "axios";

const BASE_URL = "https://fricked.onrender.com";
const VALIDATION_KEY = "f3a9c2d8e1b4f6a7c0d3e5f8a1b2c4d6";

const getBearer = () => {
  const timestamp = Math.floor(Date.now() / 1000);
  return btoa(`${timestamp}.${VALIDATION_KEY}`);
};

export const login = (username: string, password: string) =>
  axios.post(`${BASE_URL}/login`, { account: username, password }, {
    headers: { "Authorization": `Bearer ${getBearer()}` }
  });

export const getAttendance = (token: string) =>
  axios.get(`${BASE_URL}/attendance`, {
    headers: { "X-CSRF-Token": token, "Authorization": `Bearer ${getBearer()}` }
  });

export const getMarks = (token: string) =>
  axios.get(`${BASE_URL}/marks`, {
    headers: { "X-CSRF-Token": token, "Authorization": `Bearer ${getBearer()}` }
  });

export const getUser = (token: string) =>
  axios.get(`${BASE_URL}/user`, {
    headers: { "X-CSRF-Token": token, "Authorization": `Bearer ${getBearer()}` }
  });
export const getTimetable = (token: string) =>
  axios.get(`${BASE_URL}/timetable`, {
    headers: { "X-CSRF-Token": token, "Authorization": `Bearer ${getBearer()}` }
  });

export const getProfile = (token: string) =>
  axios.get(`${BASE_URL}/user`, {
    headers: { "X-CSRF-Token": token, "Authorization": `Bearer ${getBearer()}` }
  });