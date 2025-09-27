import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { WorkflowBuilder } from "./WorkflowBuilder/WorkflowBuilder";
import { useGraphQLQuery } from "../../hooks/useTanStackQuery";
import { useNavigate, useParams } from "react-router";
import { Assessment } from "./Assessment/Assessment";
import { Details } from "./Details/Details";
import { ArrowLeft } from "lucide-react";

import {
  BreadcrumbGroup,
  Spinner,
  Button,
  Alert,
} from "@cloudscape-design/components";

export const Job = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const getJobQuery = useGraphQLQuery("getJob", { jobId });

  return (
    <>
      <BreadcrumbGroup
        onClick={(e) => {
          e.preventDefault();
          navigate(e.detail.href);
        }}
        items={[
          { text: "Dashboard", href: "/" },
          {
            text: "Job",
            href: "",
          },
        ]}
      />

      <div className="flex gap-4 py-8">
        <Button
          onClick={() => navigate("/")}
          className="border-[#3a3a3a]! text-[#a0a0a0]! bg-[#1a1a1a]! hover:bg-[#2a2a2a]! hover:text-white! inline-flex! items-center! justify-center! gap-2! whitespace-nowrap! rounded-md! text-sm! font-medium! ring-offset-background! transition-colors! focus-visible:outline-none! focus-visible:ring-2! focus-visible:ring-ring! focus-visible:ring-offset-2! disabled:pointer-events-none! disabled:opacity-50! [&_svg]:pointer-events-none! [&_svg]:size-4! [&_svg]:shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back</span>
        </Button>

        <h1 className="text-xl font-semibold md:text-2xl text-white">
          Migration Job - {jobId}
        </h1>
      </div>

      <TabGroup className="mt-3">
        <TabList className="flex justify-between">
          <div className="bg-slate-800 rounded-md p-1">
            <Tab className="hover:cursor-pointer data-selected:bg-slate-700 data-selected:text-cyan-400 [&:not([data-selected])]:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:text-gray-600 disabled:hover:bg-transparent rounded-sm px-3 py-1.5 text-sm! font-medium! transition-all! focus-visible:outline-none">
              Details
            </Tab>

            {getJobQuery.data?.getJob?.kb && getJobQuery.data.getJob.s3Uri && (
              <>
                <Tab className="hover:cursor-pointer data-selected:bg-slate-700 data-selected:text-cyan-400 [&:not([data-selected])]:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:text-gray-600 disabled:hover:bg-transparent rounded-sm px-3 py-1.5 text-sm! font-medium! transition-all! focus-visible:outline-none">
                  Workflow Builder
                </Tab>

                {getJobQuery.data.getJob.agentcoreId && (
                  <Tab className="hover:cursor-pointer data-selected:bg-slate-700 data-selected:text-cyan-400 [&:not([data-selected])]:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:text-gray-600 disabled:hover:bg-transparent rounded-sm px-3 py-1.5 text-sm! font-medium! transition-all! focus-visible:outline-none">
                    Assessment
                  </Tab>
                )}
              </>
            )}
          </div>
        </TabList>

        <TabPanels className="mt-3 border border-slate-800 rounded-lg">
          {getJobQuery.isLoading ? (
            <TabPanel className="rounded-xl bg-white/5 p-6 text-white">
              <Spinner size="big" />
            </TabPanel>
          ) : getJobQuery.isError ? (
            <TabPanel className="rounded-xl bg-white/5 p-6 text-white">
              <Alert type="error">
                <pre>{JSON.stringify(getJobQuery.error, null, 2)}</pre>
              </Alert>
            </TabPanel>
          ) : (
            <>
              <TabPanel className="rounded-xl bg-white/5 p-6">
                <Details getJobQuery={getJobQuery} />
              </TabPanel>

              <TabPanel className="rounded-xl bg-white/5 p-6">
                <WorkflowBuilder getJobQuery={getJobQuery} />
              </TabPanel>

              <TabPanel className="rounded-xl bg-white/5 p-6">
                <Assessment getJobQuery={getJobQuery} />
              </TabPanel>
            </>
          )}
        </TabPanels>
      </TabGroup>
    </>
  );
};
