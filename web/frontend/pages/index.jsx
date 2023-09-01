import {
  Card,
  Page,
  Layout,
  Frame,
  Loading,
  Image,
  Link,
  Text,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

import { trophyImage } from "../assets";

import { OrderList, ProductsCard } from "../components";

export default function HomePage() {
  return (
    <Page fullWidth>
      <TitleBar title="DASH.X" primaryAction={null} />
      <Layout>
        <Layout.Section>
          <Frame>
            <Loading/>
            <OrderList />
          </Frame>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
