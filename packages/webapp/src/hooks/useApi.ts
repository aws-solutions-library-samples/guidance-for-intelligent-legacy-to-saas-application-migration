import { useMutation, useQuery } from "@tanstack/react-query";
import { getUrl, list, remove, uploadData } from "aws-amplify/storage";

export const useListS3 = (
  path: string,
  subpathStrategy: "include" | "exclude" = "exclude"
) => {
  return useQuery({
    queryKey: ["ListS3", path, subpathStrategy],
    queryFn: async () => {
      const response = await list({
        path,
        options: {
          subpathStrategy: { strategy: subpathStrategy },
        },
      });

      return {
        ...response,
        items: response.items.filter((item) => item.path != path),
      };
    },
  });
};

export const useGetS3Json = (path: string) => {
  return useQuery({
    queryKey: ["getS3Json", path],
    queryFn: async () => {
      const { url } = await getUrl({ path });

      const response = await fetch(url);
      return await response.json();
    },
  });
};

export const useGetS3JsonMutation = () => {
  return useMutation({
    mutationKey: ["getS3JsonMutation"],
    mutationFn: async (path: string) => {
      const { url } = await getUrl({ path });

      const response = await fetch(url);
      return await response.json();
    },
  });
};

export const useGetS3Raw = (path: string) => {
  return useQuery({
    queryKey: ["getS3Raw", path],
    queryFn: async () => {
      const { url } = await getUrl({ path });

      const response = await fetch(url);
      return await response.text();
    },
  });
};

export const useListS3Mutation = () => {
  return useMutation({
    mutationKey: ["ListS3"],
    mutationFn: async (path: string) => {
      const response = await list({
        path,
        options: {
          subpathStrategy: { strategy: "exclude" },
        },
      });

      return {
        ...response,
        items: response.items.filter((item) => item.path != path),
      };
    },
  });
};

interface IUseUploadS3Data {
  path: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

export const useUploadS3Data = () => {
  return useMutation({
    mutationKey: ["UploadS3Data"],
    mutationFn: async ({ data, path }: IUseUploadS3Data) => {
      const result = await uploadData({
        path,
        data,
      }).result;

      return result;
    },
  });
};

export const useRemoveS3 = () => {
  return useMutation({
    mutationKey: ["removeS3"],
    mutationFn: async (path: string) => {
      return await remove({ path });
    },
  });
};
