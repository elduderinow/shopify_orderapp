import { GraphqlQueryError } from "@shopify/shopify-api";
import shopify from "../shopify.js";

export default async function getOrders(session) {
  const client = new shopify.api.clients.Graphql({ session });

  try {
    const data = await client.query({
      data: `query {
              orders(first: 10) {
                edges {
                  node {
                    id
                    name
                    email
                    createdAt
                    customer {
                      id
                      firstName
                      lastName
                      tags
                    }
                    fullyPaid
                    billingAddress {
                      address1
                      address2
                      city
                      company
                      country
                      countryCode
                      firstName
                      lastName
                      name
                      id
                      formatted
                      latitude
                      longitude
                      province
                      provinceCode
                      zip
                    }
                    totalPriceSet {
                      presentmentMoney{
                        amount
                        currencyCode
                      }
                      shopMoney{
                        amount
                        currencyCode
                      }
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