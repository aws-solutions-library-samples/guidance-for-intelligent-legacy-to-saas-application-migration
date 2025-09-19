import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { CheckCircle, RefreshCw, Calendar, Clock } from "lucide-react";
import { useGraphQLQuery } from "../../hooks/useTanStackQuery";
import { CreateJobDialog } from "./CreateJobDialog";
import { KnowledgeBases } from "./KnowledgeBases";
import prettyBytes from "pretty-bytes";
import { useState } from "react";
import { Jobs } from "./Jobs";

import {
  Container,
  Spinner,
  Popover,
  Button,
  Grid,
} from "@cloudscape-design/components";

export const Dashboard = () => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const getDashboardMetrics = useGraphQLQuery("getDashboardMetrics");

  const tabOptions = [
    { name: "Jobs", panel: <Jobs /> },
    { name: "Knowledge Bases", panel: <KnowledgeBases /> },
  ];

  return (
    <>
      <Grid
        gridDefinition={[
          { colspan: { xxs: 12, xs: 6, s: 3 } },
          { colspan: { xxs: 12, xs: 6, s: 3 } },
          { colspan: { xxs: 12, xs: 6, s: 3 } },
          { colspan: { xxs: 12, xs: 6, s: 3 } },
        ]}
      >
        <Container className="rounded-lg! border! border-slate-800! bg-slate-900/50! min-h-33">
          <div className="flex flex-col space-y-1.5 p-2 flex-row items-center justify-between space-y-0 pb-2">
            <Popover
              header="Item count"
              content="DynamoDB updates the following information approximately every six hours."
            >
              <div className="text-2xl font-semibold leading-none tracking-tight text-sm font-medium text-slate-300">
                Total Jobs
              </div>
            </Popover>
            <RefreshCw className="h-4 w-4 text-slate-500" />
          </div>

          <div className="p-2 pt-0">
            {getDashboardMetrics.isLoading ? (
              <Spinner />
            ) : (
              <>
                <div className="text-2xl font-bold text-white">
                  {getDashboardMetrics.data?.getDashboardMetrics?.jobs?.ItemCount?.toLocaleString()}
                </div>
                <p className="text-xs text-slate-400">
                  +
                  {(
                    (getDashboardMetrics.data?.getDashboardMetrics?.jobs
                      ?.ItemCount ??
                      0 -
                        (getDashboardMetrics.data?.getDashboardMetrics?.jobs
                          ?.ItemCountLastWeek ?? 0) /
                          (getDashboardMetrics.data?.getDashboardMetrics?.jobs
                            ?.ItemCountLastWeek ?? 1)) * 100
                  ).toFixed(0)}
                  % from last week
                </p>
              </>
            )}
          </div>
        </Container>

        <Container className="rounded-lg! border! border-slate-800! bg-slate-900/50! h-full">
          <div className="flex flex-col space-y-1.5 p-2 flex-row items-center justify-between space-y-0 pb-2">
            <Popover
              header="Table size"
              content="DynamoDB updates the following information approximately every six hours."
            >
              <div className="text-2xl font-semibold leading-none tracking-tight text-sm font-medium text-slate-300">
                Table Size Bytes
              </div>
            </Popover>
            <Clock className="h-4 w-4 text-slate-500" />
          </div>

          <div className="p-2 pt-0">
            {getDashboardMetrics.isLoading ? (
              <Spinner />
            ) : (
              <>
                <div className="text-2xl font-bold text-white">
                  {prettyBytes(
                    getDashboardMetrics.data?.getDashboardMetrics?.jobs
                      ?.TableSizeBytes ?? 0
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  +
                  {prettyBytes(
                    getDashboardMetrics.data?.getDashboardMetrics?.jobs
                      ?.TableSizeBytes ??
                      0 -
                        (getDashboardMetrics.data?.getDashboardMetrics?.jobs
                          ?.ItemCountLastWeek ?? 0) /
                          (getDashboardMetrics.data?.getDashboardMetrics?.jobs
                            ?.TableSizeBytesLastWeek ?? 1)
                  )}{" "}
                  from last week
                </p>
              </>
            )}
          </div>
        </Container>

        <Container className="rounded-lg! border! border-slate-800! bg-slate-900/50! h-full">
          <div className="flex flex-col space-y-1.5 p-2 flex-row items-center justify-between space-y-0 pb-2">
            <Popover
              header="# of Agents"
              content="The total number of step function executions performed last week."
            >
              <div className="text-2xl font-semibold leading-none tracking-tight text-sm font-medium text-slate-300">
                Last Week Executions
              </div>
            </Popover>

            <CheckCircle className="h-4 w-4 text-slate-500" />
          </div>

          <div className="p-2 pt-0">
            {getDashboardMetrics.isLoading ? (
              <Spinner />
            ) : (
              <div className="text-2xl font-bold text-white">
                {
                  getDashboardMetrics.data?.getDashboardMetrics?.sfnAssessments
                    ?.ExecutionsStartedLastWeek
                }
              </div>
            )}
          </div>
        </Container>

        <Container className="rounded-lg! border! border-slate-800! bg-slate-900/50! h-full">
          <div className="flex flex-col space-y-1.5 p-2 flex-row items-center justify-between space-y-0 pb-2">
            <Popover
              header="# of Knowledge Bases"
              content="The total number of Bedrock Knowledge Bases in this region."
            >
              <div className="text-2xl font-semibold leading-none tracking-tight text-sm font-medium text-slate-300">
                Total Knowledge Bases
              </div>
            </Popover>
            <Calendar className="h-4 w-4 text-slate-500" />
          </div>

          <div className="p-2 pt-0">
            {getDashboardMetrics.isLoading ? (
              <Spinner />
            ) : (
              <div className="text-2xl font-bold text-white">
                {getDashboardMetrics.data?.getDashboardMetrics?.totalKbs?.toLocaleString()}
              </div>
            )}
          </div>
        </Container>
      </Grid>

      <TabGroup className="mt-6">
        <TabList className="flex justify-between">
          {() => (
            <>
              <div className="bg-slate-800 rounded-md p-1">
                {tabOptions.map(({ name }) => (
                  <Tab
                    key={name}
                    className="hover:cursor-pointer data-selected:bg-slate-700 data-selected:text-cyan-400 [&:not([data-selected])]:text-gray-500 rounded-sm px-3 py-1.5 text-sm! font-medium! transition-all! focus-visible:outline-none"
                  >
                    {name}
                  </Tab>
                ))}
              </div>

              <Button
                variant="inline-link"
                className="font-medium! transition-colors rounded-md! px-3! bg-gradient-to-r! from-cyan-500! to-purple-600! hover:from-cyan-600! hover:to-purple-700! text-white!"
                onClick={() => setDialogOpen(true)}
              >
                New Migration Job
              </Button>
            </>
          )}
        </TabList>

        <TabPanels className="mt-3 border border-slate-800 rounded-lg">
          {tabOptions.map(({ name, panel }) => (
            <TabPanel key={name} className="rounded-xl bg-white/5 p-3">
              {panel}
            </TabPanel>
          ))}
        </TabPanels>
      </TabGroup>

      <CreateJobDialog dialogOpen={dialogOpen} setDialogOpen={setDialogOpen} />
    </>
  );
};
