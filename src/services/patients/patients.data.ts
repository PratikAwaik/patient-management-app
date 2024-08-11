import {useQuery} from "@tanstack/react-query";
import {PatientsService} from "./patients.service";
import {Bundle, Patient} from "fhir/r4";
import {useMutate} from "@/hooks/use-mutate";

const svc = new PatientsService();

export const useGetAllPatients = (
  params: {
    name?: string;
    telecom?: string;
    _count?: number;
    _skip?: number;
  } = {}
) => {
  const {data, ...response} = useQuery({
    queryKey: ["patients", params],
    queryFn: () => svc.getAllPatients(params),
  });

  return {
    data: data?.data as Bundle,
    ...response,
  };
};

export const useGetPatientById = (patientId?: string | null) => {
  const {data, ...response} = useQuery({
    queryKey: [`patient-${patientId}`],
    queryFn: () => svc.getPatientById(patientId!),
    enabled: !!patientId,
  });

  return {
    data: data?.data as Patient,
    ...response,
  };
};

export const useCreatePatient = () => {
  return useMutate(
    svc.createPatient,
    ["patients"],
    "Patient created successfully."
  );
};

export const useUpdatePatient = () => {
  return useMutate(
    svc.updatePatient,
    ["patients"],
    "Patient updated successfully."
  );
};

export const useDeletePatient = () => {
  return useMutate(
    svc.deletePatient,
    ["patients"],
    "Patient deleted successfully."
  );
};
