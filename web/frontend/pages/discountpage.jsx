import React, { useState, useCallback, useEffect } from "react";
import { useAppQuery, useAuthenticatedFetch } from "../hooks";
import { OrderTable } from "../components";
import { uniqueNearestB2BCustomers } from "../../helpers/helpers"

import {
    Banner,
    Card,
    Layout,
    Page,
    TextField,
    LegacyStack,
    PageActions,
    ChoiceList,
    Modal,
    List,
    Text,
    Frame,
    Loading,
    Button,
} from "@shopify/polaris";

export default function DiscountPage() {
    const [orders, setOrders] = useState(null);
    const [B2BCustomers, setB2BCustomers] = useState(null);
    const [ordersByB2B, setOrdersByB2B] = useState(null)
    const [rows, setRows] = useState(null)

    const emptyToastProps = { content: null };
    const [isLoading, setIsLoading] = useState(true);
    const [toastProps, setToastProps] = useState(emptyToastProps);
    const fetch = useAuthenticatedFetch();


    const { refetch: refetchOrders } = useAppQuery({
        url: "/api/orders",
        reactQueryOptions: {
            onSuccess: () => {
                setIsLoading(false);
            },
        },
    });

    const { refetch: refetchCustomers } = useAppQuery({
        url: "/api/customers",
        reactQueryOptions: {
            onSuccess: () => {
                setIsLoading(false);
            },
        },
    });

    const { refetch: refetchDiscounts } = useAppQuery({
        url: "/api/discounts/all",
        reactQueryOptions: {
            onSuccess: () => {
                setIsLoading(false);
            },
        },
    });

    const getOrders = async () => {
        setIsLoading(true);
        try {
            await refetchOrders().then((res) => {
                const filtered = res.data.orders.body.data.orders.edges.filter((order) => {
                    return !order.node.customer.tags.includes('b2b');
                })
                setOrders(filtered)
            });
            setToastProps({ content: "orders fetched!" });
        } catch (e) {
            setIsLoading(false);
            setToastProps({
                content: "There was an error getting orders",
                error: true,
            });
        }
    };

    const getB2BCustomers = async () => {
        setIsLoading(true);
        try {
            await refetchCustomers().then((res) => {
                setB2BCustomers(res.data.customers.body.data.customers.edges)
            });
            setToastProps({ content: "customers fetched!" });
        } catch (e) {
            setIsLoading(false);
            setToastProps({
                content: "There was an error getting customers",
                error: true,
            });
        }
    };

    const assignB2BCustomerToOrder = async () => {
        setIsLoading(true);

        // Check if both orders and B2BCustomers are present
        if (!orders || !B2BCustomers) {
            console.log("Orders or B2BCustomers are missing.");
            setIsLoading(false);
            return; // Do not proceed with the fetch request
        }

        let payload = { orders: orders, b2b: B2BCustomers }
        const response = await fetch("/api/customer/closest", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const data = await response.json();
            setOrdersByB2B(data.customer)
        } else {
            setIsLoading(false);
        }
    }

    const getDiscounts = async () => {
        console.log('getting discounts')
        setIsLoading(true);
        try {
            await refetchDiscounts().then((res) => {
                console.log('discounts', res)
            });
            setToastProps({ content: "discounts fetched!" });
        } catch (e) {
            setIsLoading(false);
            setToastProps({
                content: "There was an error getting discounts",
                error: true,
            });
        }
    }

    const createDiscount = async () => {
        setIsLoading(true);
        const response = await fetch("/api/discounts/create", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(uniqueNearestB2BCustomers(ordersByB2B))
        });

        if (response.ok) {
            const data = await response.json();
            console.log('discount created', data)
        } else {
            setIsLoading(false);
            setToastProps({
                content: "There was an error creating discounts",
                error: true,
            });
        }
    }

    useEffect(() => {
        getOrders()
        getB2BCustomers()
    }, [])

    useEffect(() => {
        getDiscounts()
    }, [])

    useEffect(() => {
        assignB2BCustomerToOrder()
    }, [orders, B2BCustomers])

    return (
        <Frame>
            <Page
                title="Create Discount"
                fullWidth
            >
                <Layout sectioned={true}>
                    <Layout.Section>
                        <Text variant="heading2xl" as="h3">
                            All Orders
                        </Text>
                        {!ordersByB2B && <Loading />}
                        <OrderTable orders={ordersByB2B} />
                        <br />
                        <Button onClick={() => createDiscount()}> Create Discounts </Button>

                    </Layout.Section>
                    <Layout.Section>
                        <Text variant="heading2xl" as="h3">
                            Processed Orders
                        </Text>
                        <Frame>
                            {!ordersByB2B && <Loading />}
                            <OrderTable orders={ordersByB2B} />
                        </Frame>
                    </Layout.Section>
                </Layout>
            </Page>
        </Frame>
    );
}