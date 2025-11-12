// src/api/conditionService.js
import axios from "axios";
import { BASE_URL, API_PATHS } from "../constants/apiPaths";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

export const getAllConditions = async (token) => {
  const res = await api.get(API_PATHS.CONDITIONS.GET_ALL, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const getConditionById = async (id, token) => {
  const res = await api.get(API_PATHS.CONDITIONS.GET_BY_ID(id), {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const createCondition = async (data, token) => {
  const res = await api.post(API_PATHS.CONDITIONS.CREATE, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const deleteCondition = async (id, token) => {
  try {
    const res = await axios.delete(`${BASE_URL}${API_PATHS.CONDITIONS.DELETE(id)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (error) {
    console.error("❌ Error deleting condition:", error);
    throw error;
  }
};