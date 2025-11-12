export const BASE_URL = "http://localhost:3000";

export const API_PATHS = {
  CONDITIONS: {
    CREATE: "/fhir/conditions",
    DELETE: (id) => `/fhir/conditions/${id}`,
    GET_ALL: "/fhir/conditions/",
    GET_BY_ID: (id) => `/fhir/conditions/${id}`,
  },
  AUTH: {
    REGISTER: "/api/auth/register",
    LOGIN: "/api/auth/login",
    PROFILE: "/api/auth/profile",
    upload: "/api/auth/upload-image",
  },
  CONCEPT_MAP: {
    GET_ALL: "/fhir/ConceptMap",
    TRANSLATE_BY_CODE: (code) => `/fhir/ConceptMap/$translate?code=${code}`,
    TRANSLATE_BY_NAME: (name) =>
      `/fhir/ConceptMap/$translate?name=${encodeURIComponent(name)}`,
  },
  USER:{
    GET_ALL_USERS:"/api/user/",
    GET_USER_BY_ID:(id)=>`/api/user/${id}`
  }
};
