import {useToast} from "@/components/ui/use-toast";
import {
  MutationFunction,
  QueryKey,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

export const useMutate = <TArguments, TResult>(
  mutationFn: MutationFunction<TArguments, TResult>,
  queryIDtoInvalidate?: QueryKey,
  successMsg?: string
) => {
  const queryClient = useQueryClient();
  const {toast} = useToast();

  return useMutation({
    mutationFn,
    onSuccess() {
      if (successMsg) {
        toast({
          description: successMsg,
        });
      }
      if (queryIDtoInvalidate) {
        if (Array.isArray(queryIDtoInvalidate)) {
          queryIDtoInvalidate.forEach((queryID) => {
            queryClient.invalidateQueries({
              queryKey: queryID,
            });
          });
        } else
          queryClient.invalidateQueries({
            queryKey: queryIDtoInvalidate,
          });
      }
    },
    onError(err) {
      console.error(err);
      toast({
        title: "Uh oh! Something went wrong.",
        description: "There was a problem with your request.",
        variant: "destructive",
      });
    },
  });
};
