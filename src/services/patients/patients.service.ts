import {fhirApi} from "@/lib/axios";
import {Patient} from "fhir/r4";

export class PatientsService {
  async getAllPatients(params = {}) {
    return fhirApi.get("/Patient", {
      params,
    });
  }

  async getPatientById(patientId: string) {
    return fhirApi.get(`/Patient/${patientId}`);
  }

  async createPatient(data: Patient) {
    return fhirApi.post("/Patient", data);
  }

  async updatePatient({patientId, data}: {patientId: string; data: Patient}) {
    return fhirApi.put(`/Patient/${patientId}`, data);
  }

  async deletePatient(patientId: string) {
    return fhirApi.delete(`/Patient/${patientId}`);
  }
}
