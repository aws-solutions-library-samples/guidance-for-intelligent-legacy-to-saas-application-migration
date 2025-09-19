import { generateClient } from "aws-amplify/api";
import { useMutation, useQuery } from "@tanstack/react-query";

import * as mutations from "../graphql/mutations";
import * as queries from "../graphql/queries";
import * as subscriptions from "../graphql/subscriptions";

// Create a GraphQL client
const client = generateClient();

/**
 * Generic hook for GraphQL queries
 */
export const useGraphQLQuery = <TQuery extends keyof typeof queries>(
  query: TQuery,
  variables?: (typeof queries)[TQuery]["__generatedQueryInput"]
) => {
  return useQuery({
    queryKey: [query, variables],
    queryFn: async () => {
      const { data } = await client.graphql({
        query: queries[query],
        variables: variables as Parameters<
          typeof client.graphql
        >[0]["variables"],
      });

      return data as (typeof queries)[TQuery]["__generatedQueryOutput"];
    },
  });
};

/**
 * Generic hook for GraphQL mutations
 */
export const useGraphQLMutation = <TMutation extends keyof typeof mutations>(
  mutation: TMutation
) => {
  return useMutation({
    mutationFn: async (
      variables: (typeof mutations)[TMutation]["__generatedMutationInput"]
    ) => {
      const { data } = await client.graphql({
        query: mutations[mutation],
        variables: variables as Parameters<
          typeof client.graphql
        >[0]["variables"],
      });

      return data as (typeof mutations)[TMutation]["__generatedMutationOutput"];
    },
  });
};

/**
 * Generic hook for GraphQL subscriptions
 */
export const useGraphQLSubscription = <
  TSubscription extends keyof typeof subscriptions
>(
  subscription: TSubscription,
  variables?: (typeof subscriptions)[TSubscription]["__generatedSubscriptionInput"],
  onData?: (
    data: (typeof subscriptions)[TSubscription]["__generatedSubscriptionOutput"]
  ) => void,
  onError?: (error: Error) => void
) => {
  return {
    subscribe: () => {
      const observable = client.graphql({
        query: subscriptions[subscription],
        variables: variables as Parameters<
          typeof client.graphql
        >[0]["variables"],
      });

      return observable.subscribe({
        next: ({ data }) => {
          if (onData && data) {
            onData(
              data as (typeof subscriptions)[TSubscription]["__generatedSubscriptionOutput"]
            );
          }
        },
        error: (error) => {
          if (onError) {
            onError(error);
          }
        },
      });
    },
  };
};
