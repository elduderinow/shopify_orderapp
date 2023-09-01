import { BrowserRouter } from "react-router-dom";
import { NavigationMenu } from "@shopify/app-bridge-react";
import Routes from "./Routes";

import {
  AppBridgeProvider,
  QueryProvider,
  PolarisProvider,
  DiscountProvider,
} from "./components";

export default function App() {
  console.log('test')
  // Any .tsx or .jsx files in /pages will become a route
  // See documentation for <Routes /> for more info
  const pages = import.meta.globEager("./pages/**/!(*.test.[jt]sx)*.([jt]sx)");

  return (
    <PolarisProvider>
        <BrowserRouter>
          <AppBridgeProvider>
          <DiscountProvider>
            <QueryProvider>
              <NavigationMenu
                navigationLinks={[
                  {
                    label: "Discounts",
                    destination: "/discountpage",
                  },
                  {
                    label: "Order to Invoice",
                    destination: "/pagename",
                  },
                ]}
              />
              <Routes pages={pages} />
            </QueryProvider>
            </DiscountProvider>
          </AppBridgeProvider>
        </BrowserRouter>
    </PolarisProvider>
  );
}
