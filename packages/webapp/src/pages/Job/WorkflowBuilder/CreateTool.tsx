import {
  Button,
  Box,
  Modal,
  FormField,
  Textarea,
  PromptInput,
  Alert,
  SpaceBetween,
} from "@cloudscape-design/components";
import { CodeView } from "@cloudscape-design/code-view";
import pythonHighlight from "@cloudscape-design/code-view/highlight/python";

import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import { Avatar, ChatBubble } from "@cloudscape-design/chat-components";
import {
  useGraphQLMutation,
  useGraphQLSubscription,
} from "../../../hooks/useTanStackQuery";
import { useState, useEffect, type Dispatch, type SetStateAction } from "react";
import { useParams } from "react-router";
import toast from "react-hot-toast";
import { useGetS3JsonMutation } from "../../../hooks/useApi";
import { map } from "lodash";

type CreateToolInput = {
  prompt: string;
  type: string;
  followup: string;
};

interface ICreateTool {
  createTool: boolean;
  setCreateTool: Dispatch<SetStateAction<boolean>>;
}

interface MessageItem {
  type: string;
  eventId: string;
  message: string;
}

interface ContentBlock {
  text?: string;
  toolUse?: {
    name: string;
    input: {
      path?: string;
      content?: string;
      code?: string;
      [key: string]: unknown;
    };
  };
}

export const CreateTool = ({ createTool, setCreateTool }: ICreateTool) => {
  const { jobId } = useParams();
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [writing, setWriting] = useState(false);

  const { handleSubmit, control } = useForm<CreateToolInput>();

  const createToolMutation = useGraphQLMutation("createTool");

  const getS3JsonMutation = useGetS3JsonMutation();

  const getLastConversation = async () => {
    try {
      const conversation = await getS3JsonMutation.mutateAsync(
        `jobs/${jobId}/sessions/session.json`
      );
      const messages = map(conversation, "content");

      const results = messages.map((item) => {
        return {
          type: "message",
          eventId: crypto.randomUUID(),
          message: JSON.stringify(item),
        };
      });

      setMessages(results);

      toast.success("Conversation loaded!");
    } catch (error) {
      toast.error(JSON.stringify(error, null, 2));
    }
  };

  // Set up subscription to log events for this jobId
  const toolCreationSubscription = useGraphQLSubscription(
    "onToolCreationUpdate",
    { jobId: jobId! },
    (data) => {
      console.log(data);
      if (
        ["init_event_loop", "start_event_loop", "start"].includes(
          data?.onToolCreationUpdate?.type ?? ""
        )
      ) {
        setWriting(true);
      } else if (data?.onToolCreationUpdate?.type == "end_turn") {
        setWriting(false);
      } else if (data?.onToolCreationUpdate) {
        setMessages((prevMessages) => [
          ...prevMessages,
          data.onToolCreationUpdate as MessageItem,
        ]);
      }
    },
    (error) => {
      console.error("Tool Creation Subscription Error:", error);
    }
  );

  // Subscribe to tool creation updates when component mounts and jobId is available
  useEffect(() => {
    if (!jobId) return;

    const subscription = toolCreationSubscription.subscribe();

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [jobId, toolCreationSubscription]);

  const onSubmit: SubmitHandler<CreateToolInput> = async (data) => {
    const { prompt, followup } = data;
    try {
      if (followup) {
        await createToolMutation.mutateAsync({
          jobId,
          prompt: followup,
          loadHistory: true,
        });
        toast.success("Followup questions sent!");
      } else {
        await createToolMutation.mutateAsync({ jobId, prompt });
        setMessages([
          {
            type: "message",
            eventId: crypto.randomUUID(),
            message: JSON.stringify([{ text: prompt }]),
          },
        ]);
        toast.success("Tool creation started!");
      }
    } catch (error) {
      return toast.error(JSON.stringify(error, null, 2));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Modal
        size={"max"}
        onDismiss={() => {
          if (!createToolMutation.isPending) setCreateTool(false);
        }}
        visible={createTool}
        footer={
          messages.length ? (
            <Controller
              name="followup"
              render={({ field, fieldState }) => (
                <FormField errorText={fieldState.error?.type} stretch>
                  <PromptInput
                    {...field}
                    onChange={({ detail }) => field.onChange(detail.value)}
                    placeholder="Ask a question"
                    actionButtonIconName="send"
                    disabled={writing || createToolMutation.isPending}
                    onAction={async () => {
                      await handleSubmit(onSubmit)();
                      field.onChange("");
                    }}
                  />
                </FormField>
              )}
              control={control}
            />
          ) : (
            <Box float="right">
              <SpaceBetween size="s" direction="horizontal">
                <Button
                  onClick={() => getLastConversation()}
                  loading={getS3JsonMutation.isPending}
                >
                  Load Last Conversation
                </Button>
                <Button
                  variant="primary"
                  formAction="submit"
                  onClick={() => handleSubmit(onSubmit)()}
                  loading={createToolMutation.isPending}
                >
                  Start
                </Button>
              </SpaceBetween>
            </Box>
          )
        }
        header="Tool Creation"
      >
        {messages.length ? (
          <>
            {messages.map(({ type, eventId, message }) => {
              switch (type) {
                case "message":
                  return (
                    <ChatBubble
                      ariaLabel="Tool"
                      type="incoming"
                      avatar={
                        <Avatar
                          color="gen-ai"
                          iconName="gen-ai"
                          ariaLabel="Human"
                        />
                      }
                      key={eventId}
                    >
                      <pre className="whitespace-pre-wrap">
                        {JSON.parse(message).map(
                          (contentBlock: ContentBlock) => {
                            if (contentBlock.text) {
                              return <div>{contentBlock.text}</div>;
                            } else if (contentBlock.toolUse) {
                              return (
                                <div className="pt-2">
                                  <h3>{contentBlock.toolUse.name}</h3>
                                  {(() => {
                                    switch (contentBlock.toolUse.name) {
                                      case "file_write":
                                        return (
                                          <>
                                            <>
                                              path:{" "}
                                              {contentBlock.toolUse.input.path}
                                            </>
                                            <CodeView
                                              content={
                                                contentBlock.toolUse.input
                                                  .content ?? ""
                                              }
                                              highlight={pythonHighlight}
                                            />
                                          </>
                                        );
                                      case "python_repl":
                                        return (
                                          <CodeView
                                            content={
                                              contentBlock.toolUse.input.code ??
                                              ""
                                            }
                                            highlight={pythonHighlight}
                                          />
                                        );

                                      default:
                                        return (
                                          <CodeView
                                            content={JSON.stringify(
                                              contentBlock.toolUse.input
                                            )}
                                            highlight={pythonHighlight}
                                          />
                                        );
                                    }
                                  })()}
                                </div>
                              );
                            } else {
                              return <>{JSON.stringify(contentBlock)}</>;
                            }
                          }
                        )}
                      </pre>
                    </ChatBubble>
                  );
                case "force_stop":
                  return (
                    <Alert
                      className="my-5"
                      type="error"
                      children={JSON.stringify(message)}
                    />
                  );
                default:
                  return (
                    <ChatBubble
                      key={eventId}
                      ariaLabel="Tool"
                      type="outgoing"
                      avatar={
                        <Avatar
                          iconName="suggestions"
                          ariaLabel="Human"
                          tooltipText="Human"
                          color="gen-ai"
                        />
                      }
                    >
                      {JSON.stringify("Test")}
                    </ChatBubble>
                  );
              }
            })}
            {writing && (
              <ChatBubble
                ariaLabel="Tool"
                type="outgoing"
                avatar={
                  <Avatar ariaLabel="Assistant" color="gen-ai" loading={true} />
                }
              >
                {""}
              </ChatBubble>
            )}
            <Box textAlign="center" className="mt-5">
              <Button
                disabled={writing}
                onClick={() => {
                  try {
                    createToolMutation.mutateAsync({
                      jobId,
                      loadHistory: true,
                      saveTools: true,
                    });
                    toast.success("Save triggered!");
                  } catch (error) {
                    toast.error(JSON.stringify(error, null, 2));
                  }
                }}
                loading={createToolMutation.isPending}
              >
                Save Tool
              </Button>
            </Box>
          </>
        ) : (
          <Controller
            name="prompt"
            rules={{ required: true }}
            render={({ field, fieldState }) => (
              <FormField
                description="Explain in detail the goal"
                label="System Prompt"
                errorText={fieldState.error?.type}
                stretch
              >
                <Textarea
                  {...field}
                  disabled={createToolMutation.isPending}
                  placeholder="Explain in detail the goal of this function"
                  onChange={({ detail }) => field.onChange(detail.value)}
                  className="grow!"
                />
              </FormField>
            )}
            control={control}
          />
        )}
      </Modal>
    </form>
  );
};
