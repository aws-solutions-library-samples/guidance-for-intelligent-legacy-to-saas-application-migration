import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Authenticator } from "@aws-amplify/ui-react";
import { RouterProvider } from "react-router";
import { createRoot } from "react-dom/client";
import { awsconfig } from "./aws-config";
import { Amplify } from "aws-amplify";
import { router } from "./routes.tsx";
import { StrictMode } from "react";
import { I18nProvider } from "@cloudscape-design/components/i18n";
import messages from "@cloudscape-design/components/i18n/messages/all.all";

import "./index.css";
import "@aws-amplify/ui-react/styles.css";
import "@xyflow/react/dist/style.css";

Amplify.configure(awsconfig);

// Create a client
const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Authenticator hideSignUp variation="modal">
        {() => (
          <I18nProvider locale="en" messages={[messages]}>
            <RouterProvider router={router} />
          </I18nProvider>
        )}
      </Authenticator>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>
);
