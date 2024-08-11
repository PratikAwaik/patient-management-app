import axios from "axios";

export const fhirApi = axios.create({
  baseURL: "https://demo.kodjin.com/fhir",
  headers: {
    "Content-Type": "application/fhir+json",
    Prefer: "pagination=offset-skip",
  },
});
