import { useState, useEffect, useCallback } from "react";
import { Toast, useAppBridge, useNavigate } from "@shopify/app-bridge-react";
import { useAppQuery, useAuthenticatedFetch } from "../hooks";
import { ButtonGroup, Button, DataTable } from "@shopify/polaris";
import { useForm, useField } from "@shopify/react-form";

import { resolveShopifyUrl, uniqueNearestB2BCustomers, getLastMonthDate } from "../../helpers/helpers";

export function OrderList() {
    const [orders, setOrders] = useState(null);
    const [B2BCustomers, setB2BCustomers] = useState(null);
    const [closestCustomer, setClosestCustomer] = useState(null)
    const [rows, setRows] = useState(null)
    const navigate = useNavigate();

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
                console.log(res)
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

    const getClosestB2BCustomer = async (orders, B2BCustomers) => {
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
            setClosestCustomer(data.customer)
        } else {
            setIsLoading(false);
        }
    }

    const calculateDiscount = (price) => {
        price = parseFloat(price)
        let discount = (10 / 100) * price
        return discount.toFixed(2)
    }

    const createDiscount = async (closestCustomer) => {
        setIsLoading(true);
        const response = await fetch("/api/discounts/create", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(uniqueNearestB2BCustomers(closestCustomer))
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

    const createDataTableUrl = (id) => {
        const params = resolveShopifyUrl(id)

        const ellipsis = {
            cursor: "pointer"
        };

        const handleClick = () => {
            navigate({
                name: params[0],
                resource: {
                    id: params[1],
                }
            });
        }

        return (
            <p style={ellipsis} onClick={() => handleClick()}>...</p>
        )
    }

    useEffect(() => {
        getOrders()
        getB2BCustomers()
    }, [])

    useEffect(() => {
        getClosestB2BCustomer(orders, B2BCustomers)
    }, [orders, B2BCustomers])

    useEffect(() => {
        console.log(closestCustomer)

        setRows(closestCustomer?.map((order) => ([
            order.order.order.name,
            order.order.order.createdAt,
            order.order.order.customer.firstName + ' ' + order.order.order.customer.lastName,
            order.order.order.totalPriceSet.presentmentMoney.amount + ' ' + order.order.order.totalPriceSet.presentmentMoney.currencyCode,
            order.nearestB2BCustomer.b2bCustomer.displayName,
            calculateDiscount(order.order.order.totalPriceSet.presentmentMoney.amount) + ' ' + order.order.order.totalPriceSet.presentmentMoney.currencyCode,
            createDataTableUrl(order.order.order.id)
        ]
        )));
    }, [closestCustomer])

    return (
        <>
            <div class="dashboard-wrapper">
                {rows &&
                    <DataTable
                        columnContentTypes={[
                            'text',
                            'date',
                            'text',
                            'text',
                            'text',
                            'text',
                            'text',
                        ]}
                        headings={[
                            '#',
                            'Date',
                            'Retail Klant',
                            'Total',
                            'b2b klant',
                            'b2b discount 10%',
                            '',
                        ]}
                        rows={rows}
                    />
                }
                <Button onClick={() => createDiscount(closestCustomer)}> Create Discounts </Button>
            </div>
        </>
    );
}
