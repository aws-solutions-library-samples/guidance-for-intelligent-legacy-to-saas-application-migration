import type { UseQueryResult } from "@tanstack/react-query";
import { type Dispatch, type SetStateAction } from "react";
import {
  Header,
  Link,
  Modal,
  SpaceBetween,
} from "@cloudscape-design/components";
import { useRemoveS3 } from "../../../hooks/useApi";
import toast from "react-hot-toast";
import type { ListPaginateWithPathOutput } from "aws-amplify/storage";

interface IDelFile {
  delFile: boolean;
  setDelFile: Dispatch<SetStateAction<boolean>>;
  listS3: UseQueryResult<ListPaginateWithPathOutput, Error>;
}

export const DelFile = ({ delFile, setDelFile, listS3 }: IDelFile) => {
  const removeS3 = useRemoveS3();

  return (
    <Modal
      onDismiss={() => setDelFile(false)}
      visible={delFile}
      header={
        <Header description="Select the file you wish to delete">
          Delete File
        </Header>
      }
    >
      <SpaceBetween size="xxs">
        {listS3.data?.items.map(({ path }) => {
          return (
            <Link
              key={path}
              onClick={async () => {
                try {
                  await removeS3.mutateAsync(path);
                  toast.success("File deleted");
                  listS3.refetch();
                } catch (error) {
                  toast.error(JSON.stringify(error, null, 2));
                }
              }}
            >
              {path.split("/").slice(3).join("/")}
            </Link>
          );
        })}
      </SpaceBetween>
    </Modal>
  );
};
