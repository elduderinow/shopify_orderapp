import { GraphqlQueryError } from "@shopify/shopify-api";
import shopify from "../shopify.js";
import { calculateDiscount, getLastMonthDate } from "../helpers/helpers.js";
import voucher_codes from 'voucher-code-generator'
const CREATE_DISCOUNT_MUTATION = `
mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
    discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
      codeDiscountNode {
        codeDiscount {
          ... on DiscountCodeBasic {
            title
            codes(first: 10) {
              nodes {
                code
              }
            }
            startsAt
            endsAt
            customerSelection {
              ... on DiscountCustomerAll {
                allCustomers
              }
            }
            customerGets {
              value {
                ... on DiscountPercentage {
                  percentage
                }
              }
              items {
                ... on AllDiscountItems {
                  allItems
                }
              }
            }
            appliesOncePerCustomer
          }
        }
      }
      userErrors {
        field
        code
        message
      }
    }
  }
  
`;

const generateDiscountCode = (customerName) => {
  const today = new Date()

  const res = voucher_codes.generate({
    prefix: `${customerName}-`,
    postfix: `-${today.getFullYear()}`,
    length: 5,
    count: 1
  })
  return res[0]
}

const calculateDiscountFromOrders = (orders, discPercentage) => {
  let totalAmount = 0
  orders.forEach(order => {
    totalAmount = totalAmount + parseFloat(order.order.totalPriceSet.presentmentMoney.amount)
  });

  return calculateDiscount(totalAmount, discPercentage)
}

export default async function createDiscount(session, discounts) {

  const client = new shopify.api.clients.Graphql({ session });

  console.log('DISC', discounts)
  try {
    for (let i = 0; i < discounts.length; i++) {
      const customerName = discounts[i].nearestB2BCustomer.b2bCustomer.firstName
      const todaysDate = new Date('2023-10-01');
      const b2bCustomer = discounts[i].nearestB2BCustomer.id
      const discountCode = generateDiscountCode(customerName)
      const discountAmount = calculateDiscountFromOrders(discounts[i].orders, 10)

      discounts[i].nearestB2BCustomer.discountCode = discountCode
      discounts[i].nearestB2BCustomer.discountAmount = discountAmount
      discounts[i].nearestB2BCustomer.discountStart = todaysDate
      discounts[i].nearestB2BCustomer.discountEnd = getLastMonthDate(todaysDate)

      await client.query({
        data: {
          query: CREATE_DISCOUNT_MUTATION,
          variables: {
            "basicCodeDiscount": {
              "title": discountCode,
              "code": discountCode,
              "startsAt": todaysDate,
              "endsAt": getLastMonthDate(todaysDate),
              "customerSelection": {
                "all": false,
                "customers": {
                  "add": [
                    b2bCustomer
                  ]
                }
              },
              "customerGets": {
                "value": {
                  "discountAmount": {
                    "amount": discountAmount.toString(),
                    "appliesOnEachItem": false
                  },
                },
                "items": {
                  "all": true
                }
              },
              "appliesOncePerCustomer": true
            }
          }

        },
      });
    };
    return discounts
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
