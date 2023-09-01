import { GraphqlQueryError } from "@shopify/shopify-api";
import shopify from "../shopify.js";

export default async function getDiscounts(session) {
    console.log('getting discounts gql')
    const client = new shopify.api.clients.Graphql({ session });

    try {
        const data = await client.query({
            data: `query {
                codeDiscountNodes(first: 10) {
                  nodes {
                    id
                    codeDiscount {
                      ... on DiscountCodeBasic {
                        title
                        summary
                      }
                    }
                  }
                }
              } `,
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