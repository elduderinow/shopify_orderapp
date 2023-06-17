import { useState, useEffect } from "react";
import { Toast } from "@shopify/app-bridge-react";
import { useAppQuery, useAuthenticatedFetch } from "../hooks";

export function OrderList() {
    const [orders, setOrders] = useState(null)

    const emptyToastProps = { content: null };
    const [isLoading, setIsLoading] = useState(true);
    const [toastProps, setToastProps] = useState(emptyToastProps);
    const fetch = useAuthenticatedFetch();

    const {
        data,
        refetch: refetchProductCount,
        isLoading: isLoadingCount,
        isRefetching: isRefetchingCount,
    } = useAppQuery({
        url: "/api/orders",
        reactQueryOptions: {
            onSuccess: () => {
                setIsLoading(false);
            },
        },
    });

    const getOrders = async () => {
        setIsLoading(true);
        const response = await fetch("/api/orders");

        if (response.ok) {
            await refetchProductCount().then((res) => {
                const filtered = res.data.orders.body.data.orders.edges.filter((order) => {
                    return !order.node.customer.tags.includes('b2b');
                })
                setOrders(filtered)
            });
            setToastProps({ content: "5 products created!" });
        } else {
            setIsLoading(false);
            setToastProps({
                content: "There was an error creating products",
                error: true,
            });
        }
    };

    useEffect(() => {
        getOrders()
    }, [])

    useEffect(() => {
        console.log(orders)
    }, [orders])

    return (
        <div class="dashboard-wrapper">
            <table className="">
                <thead>
                    <tr>
                        <td>
                            #
                        </td>
                        <td>
                            date
                        </td>
                        <td>
                            customer
                        </td>
                        <td>
                            total
                        </td>
                        <td>
                            payment status
                        </td>
                        <td>
                            items
                        </td>
                    </tr>
                </thead>
                <tbody>
                    {orders && orders.map((order) => (
                        <tr>
                            <td>{order.node.name}</td>
                            <td>{order.node.createdAt}</td>
                            <td>{order.node.customer.firstName} {order.node.customer.lastName}</td>
                            <td>{`${order.node.totalPriceSet.presentmentMoney.amount} ${order.node.totalPriceSet.presentmentMoney.currencyCode}`}</td>
                            <td>{order.node.fullyPaid && 'fully Paid'}</td>
                            <td>/</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
