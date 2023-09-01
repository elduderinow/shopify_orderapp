import { useState, useEffect, useCallback } from "react";

import { DataTable } from "@shopify/polaris";
import { calculateDiscount, resolveShopifyUrl } from "../../helpers/helpers";
import { SkeletonBodyText } from "@shopify/polaris";



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

const returnDataSkeleton = (columns, rowsAmount) => {
    const col = columns.map(column => {
        return <SkeletonBodyText lines={1} />
    })
    const rows = new Array(rowsAmount).fill(col);
    return rows
}

export function OrderTable({ orders }) {
    const columns = ['text', 'date', 'text', 'text', 'text', 'text', 'text']
    const headings = ['#', 'Date', 'Retail Klant', 'Total', 'b2b klant', 'b2b discount 10%', '']
    
    let rows = returnDataSkeleton(columns, 6)
    if (orders) {
        rows = orders.map(order => (
            [
                order.order.order.name,
                order.order.order.createdAt,
                order.order.order.customer.firstName + ' ' + order.order.order.customer.lastName,
                order.order.order.totalPriceSet.presentmentMoney.amount + ' ' + order.order.order.totalPriceSet.presentmentMoney.currencyCode,
                order.nearestB2BCustomer.b2bCustomer.displayName,
                calculateDiscount(order.order.order.totalPriceSet.presentmentMoney.amount, 10) + ' ' + order.order.order.totalPriceSet.presentmentMoney.currencyCode,
                createDataTableUrl(order.order.order.id)
            ]
        ));
    }

    return (
        <div class="dashboard-wrapper">
            <DataTable
                columnContentTypes={columns}
                headings={headings}
                rows={rows}
            />
        </div>
    );
}