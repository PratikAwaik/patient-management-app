import Layout from "@/components/layout";
import Spinner from "@/components/svg/spinner";
import {Button} from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreatePatient,
  useGetPatientById,
  useUpdatePatient,
} from "@/services/patients/patients.data";
import {Gender} from "@/types/patient";
import {zodResolver} from "@hookform/resolvers/zod";
import {Patient} from "fhir/r4";
import {useEffect} from "react";
import {useForm} from "react-hook-form";
import {Link, useNavigate, useSearchParams} from "react-router-dom";
import * as z from "zod";

const genderOptions = [
  {
    label: "Male",
    value: Gender.MALE,
  },
  {
    label: "Female",
    value: Gender.FEMALE,
  },
  {
    label: "Other",
    value: Gender.OTHER,
  },
  {
    label: "Unknown",
    value: Gender.UNKNOWN,
  },
];

const createPatientFormSchema = z.object({
  firstName: z.string(),
  lastName: z.string().optional(),
  gender: z.nativeEnum(Gender),
  dateOfBirth: z.string(),
  phone: z.string().optional(),
});

type CreatePatientFormValues = z.infer<typeof createPatientFormSchema>;

export default function CreatePatientPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get("patientId");

  const form = useForm<CreatePatientFormValues>({
    resolver: zodResolver(createPatientFormSchema),
  });

  const {data, isLoading: isPatientLoading} = useGetPatientById(patientId);
  const {mutateAsync: createPatient, isPending: isCreatePending} =
    useCreatePatient();
  const {mutateAsync: updatePatient, isPending: isUpdatePending} =
    useUpdatePatient();

  useEffect(() => {
    if (data) {
      form.reset({
        firstName: data?.name?.[0]?.given?.[0],
        lastName: data?.name?.[0]?.family,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore: unknown is valid value in Gender enum
        gender: data?.gender,
        dateOfBirth: data?.birthDate,
        phone: data?.telecom?.find((item) => item.system === "phone")?.value,
      });
    }
  }, [data, form]);

  const createSubmitPayload = (values: CreatePatientFormValues) => {
    const payload: Patient = {
      resourceType: "Patient",
      name: [
        {
          given: [values.firstName],
          family: values.lastName,
        },
      ],
      gender: values.gender,
      birthDate: values.dateOfBirth,
      telecom: values.phone
        ? [
            {
              system: "phone",
              value: values.phone,
            },
          ]
        : undefined,
      active: data ? data?.active : true,
    };

    return payload;
  };

  const handleSubmit = async (values: CreatePatientFormValues) => {
    const payload = createSubmitPayload(values);

    if (patientId && data) {
      await updatePatient(
        {
          patientId,
          data: {
            ...data,
            ...payload,
          },
        },
        {
          onSuccess() {
            navigate(-1);
          },
        }
      );
    } else {
      await createPatient(payload, {
        onSuccess() {
          navigate(-1);
        },
      });
    }
  };

  return (
    <Layout>
      <div className="flex flex-col gap-y-10 w-full max-w-lg">
        <h1 className="text-4xl font-bold">
          {patientId && data ? "Update Patient" : "Create Patient"}
        </h1>
        {isPatientLoading ? (
          <div className="w-full h-96 flex items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              <FormField
                control={form.control}
                name="firstName"
                render={({field}) => {
                  return (
                    <FormItem aria-required>
                      <FormLabel className="required">First name</FormLabel>
                      <FormControl>
                        <Input placeholder="First name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({field}) => {
                  return (
                    <FormItem>
                      <FormLabel>Last name</FormLabel>
                      <FormControl>
                        <Input placeholder="Last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({field}) => {
                  return (
                    <FormItem aria-required>
                      <FormLabel className="required">Gender</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={(value) => field.onChange(value)}
                          {...field}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            {genderOptions.map((gender) => (
                              <SelectItem
                                key={gender.value}
                                value={gender.value}
                              >
                                {gender.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({field}) => {
                  return (
                    <FormItem aria-required>
                      <FormLabel className="required">Date of birth</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          placeholder="Date of birth"
                          max={Date.now()}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({field}) => {
                  return (
                    <FormItem>
                      <FormLabel>Phone number</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="1234567890"
                          pattern="[0-9]{10}"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <Button
                disabled={isCreatePending || isUpdatePending}
                loading={isCreatePending || isUpdatePending}
                className="block w-full"
              >
                {patientId && data ? "Update" : "Create"}
              </Button>
              <Link to={"/"} className="block w-full">
                <Button type="button" variant="secondary" className="w-full">
                  Cancel
                </Button>
              </Link>
            </form>
          </Form>
        )}
      </div>
    </Layout>
  );
}
