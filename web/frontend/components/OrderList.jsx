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
            await refetchProductCount();
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
        console.log(data)
    }, [data])
    return (
        <>
            test
        </>
    );
}
