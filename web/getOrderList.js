import { GraphqlQueryError } from "@shopify/shopify-api";
import shopify from "./shopify.js";

export default async function getOrderList(session) {
    const client = new shopify.api.clients.Graphql({ session });

    try {
        const data = await client.query({
            data: `query {
            orders(first: 10) {
              edges {
                node {
                  id
                }
              }
            }
          }`,
        });
        return data;
    } catch (error) {
        if (error instanceof GraphqlQueryError) {
            throw new Error(
                `${error.message}\n${JSON.stringify(error.response, null, 2)}`
            );
        } else {
            throw error;
        }
    }
}