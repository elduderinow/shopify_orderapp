import { GraphqlQueryError } from "@shopify/shopify-api";
import shopify from "../shopify.js";

export default async function getB2BCustomers(session) {
  const client = new shopify.api.clients.Graphql({ session });

  try {
    const data = await client.query({
      data: `query {
        customers(first: 10, query: "tag:b2b") {
          edges {
            node {
              id
              firstName
              lastName
              displayName
              email
              phone
              tags
              defaultAddress {
                formattedArea
                address1
              }
            }
          }
        }
      }
            `,
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