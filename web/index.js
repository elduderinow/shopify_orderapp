// @ts-check
import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";
import 'dotenv/config' 

import shopify from "./shopify.js";
import productCreator from "./product-creator.js";
import getOrders from "./backend/getOrders.js";
import getB2BCustomers from "./backend/getB2BCustomers.js";
import getClosestB2BCustomer from "./backend/getClosestB2BCustomer.js";
import getDiscounts from "./backend/getDiscounts.js"
import GDPRWebhookHandlers from "./gdpr.js";

import createDiscount from "./backend/createDiscount.js";
import notifyB2bCustomers from "./backend/notifyB2bCustomers.js"
import { calculateDiscount } from "./helpers/helpers.js";

const PORT = parseInt(process.env.BACKEND_PORT || process.env.PORT, 10);

const CREATE_CODE_MUTATION = `
  mutation CreateCodeDiscount($discount: DiscountCodeAppInput!) {
    discountCreate: discountCodeAppCreate(codeAppDiscount: $discount) {
      userErrors {
        code
        message
        field
      }
    }
  }
`;

const CREATE_AUTOMATIC_MUTATION = `
  mutation CreateAutomaticDiscount($discount: DiscountAutomaticAppInput!) {
    discountCreate: discountAutomaticAppCreate(
      automaticAppDiscount: $discount
    ) {
      userErrors {
        code
        message
        field
      }
    }
  }
`;

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

const app = express();

// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: GDPRWebhookHandlers })
);

// If you are adding routes outside of the /api path, remember to
// also add a proxy rule for them in web/frontend/vite.config.js

app.use("/api/*", shopify.validateAuthenticatedSession());

app.use(express.json());

const runDiscountMutation = async (req, res, mutation) => {
  const session = res.locals.shopify.session

  const client = new shopify.api.clients.Graphql({ session });
  console.log('AAAAAA', req.body)

  const data = await client.query({
    data: {
      query: mutation,
      variables: req.body
    }
  });
  console.log(data.body)
  res.send(data.body)
}

app.post("/api/discounts/code", async (req, res) => {
  await runDiscountMutation(req, res, CREATE_CODE_MUTATION);
})

app.post("/api/discounts/automatic", async (req, res) => {
  await runDiscountMutation(req, res, CREATE_AUTOMATIC_MUTATION);
});

app.post("/api/discounts/create", async (req, res) => {
  let status = 200;
  let error = null;

  try {
    const discounts = await createDiscount(res.locals.shopify.session, req.body);
    await notifyB2bCustomers(discounts)
    res.status(status).send(discounts);
  } catch (e) {
    console.log(`Failed to create discount: ${e.message}`);
    status = 500;
    error = e.message;
    res.status(status).send(error);
  }
})

app.get("/api/discounts/all", async (req, res) => {

  let status = 200;
  let error = null;

  try {
    const response = await getDiscounts(res.locals.shopify.session);
    res.status(status).send(response);
  } catch (e) {
    console.log(`Failed to get discount: ${e.message}`);
    status = 500;
    error = e.message;
    res.status(status).send(error);
  }
})


app.get("/api/products/count", async (_req, res) => {
  const countData = await shopify.api.rest.Product.count({
    session: res.locals.shopify.session,
  });
  res.status(200).send(countData);
});

app.get("/api/products/create", async (_req, res) => {
  let status = 200;
  let error = null;

  try {
    await productCreator(res.locals.shopify.session);
  } catch (e) {
    console.log(`Failed to process products/create: ${e.message}`);
    status = 500;
    error = e.message;
  }
  res.status(status).send({ success: status === 200, error });
});

app.get("/api/orders", async (req, res) => {
  let status = 200;
  let error = null;

  try {
    const orderList = await getOrders(res.locals.shopify.session); // Assuming getOrderList function is properly defined
    res.status(status).send({ success: true, orders: orderList });
  } catch (e) {
    console.log(`Failed to get orders: ${e.message}`);
    status = 500;
    error = e.message;
    res.status(status).send({ success: false, error });
  }
});

app.get("/api/customers", async (req, res) => {
  let status = 200;
  let error = null;

  try {
    const customerList = await getB2BCustomers(res.locals.shopify.session);
    res.status(status).send({ success: true, customers: customerList });
  } catch (e) {
    console.log(`Failed to get B2B customers: ${e.message}`);
    status = 500;
    error = e.message;
    res.status(status).send({ success: false, error });
  }
});

app.post("/api/customer/closest", async (req, res) => {
  let status = 200;
  let error = null;

  try {
    const closestB2BCustomer = await getClosestB2BCustomer(req.body.orders, req.body.b2b);
    res.status(status).send({ success: true, customer: closestB2BCustomer });
  } catch (e) {
    console.log(`Failed to get closest B2B customers: ${e.message}`);
    status = 500;
    error = e.message;
    res.status(status).send({ success: false, error });
  }
})

app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(readFileSync(join(STATIC_PATH, "index.html")));
});

app.listen(PORT);
