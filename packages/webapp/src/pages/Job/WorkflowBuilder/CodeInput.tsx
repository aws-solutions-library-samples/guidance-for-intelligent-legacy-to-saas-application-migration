import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import { useGetS3Raw, useUploadS3Data } from "../../../hooks/useApi";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import {
  Button,
  CodeEditor,
  SpaceBetween,
  type CodeEditorProps,
} from "@cloudscape-design/components";
import { useGraphQLMutation } from "../../../hooks/useTanStackQuery";

type CodeInput = {
  code: string;
};

interface ICodeInput {
  uri: string;
}

export const CodeInput = ({ uri }: ICodeInput) => {
  const [ace, setAce] = useState<typeof import("ace-builds")>();
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState<CodeEditorProps.Preferences>({
    wrapLines: true,
    theme: "cloud_editor_dark",
  });
  const startDeployment = useGraphQLMutation("startDeployment");

  const code = useGetS3Raw(uri.split("/").slice(3).join("/"));
  const uploadS3Data = useUploadS3Data();

  useEffect(() => {
    const loadAce = async () => {
      const ace = await import("ace-builds");
      ace.config.set("useStrictCSP", true);
      ace.config.set("basePath", "/ace");

      setAce(ace);
      setLoading(false);
    };

    loadAce();
  }, []);

  const { handleSubmit, control, setValue } = useForm<CodeInput>();

  useEffect(() => {
    if (uri) {
      setValue("code", code.data ?? "");
    }
  }, [code.data, setValue, uri]);

  const onSubmit: SubmitHandler<CodeInput> = async (data) => {
    const { code } = data;
    try {
      await uploadS3Data.mutateAsync({
        data: code,
        path: uri.split("/").slice(3).join("/"),
      });
      return toast.success("Code File updated!");
    } catch (error) {
      return toast.error(JSON.stringify(error, null, 2));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="code"
        rules={{ required: true }}
        render={({ field }) => (
          <SpaceBetween size="l">
            <CodeEditor
              value={field.value}
              ace={ace}
              language="python"
              onDelayedChange={(event) => field.onChange(event.detail.value)}
              onPreferencesChange={(event) => setPreferences(event.detail)}
              preferences={preferences}
              loading={loading}
              themes={{
                light: ["cloud_editor"],
                dark: ["cloud_editor_dark"],
              }}
            />
            <SpaceBetween direction="horizontal" size="m">
              <Button
                disabled={!field.value || startDeployment.isPending}
                loading={uploadS3Data.isPending}
              >
                Save Code
              </Button>
            </SpaceBetween>
          </SpaceBetween>
        )}
        control={control}
      />
    </form>
  );
};
