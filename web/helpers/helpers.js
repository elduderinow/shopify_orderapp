export const calculateDiscount = (price, percentage) => {
    price = parseInt(price)
    let discount = (percentage / 100) * price
    return discount.toFixed(2)
}

export const resolveShopifyUrl = (id) => {
    const res = id.split('gid://shopify/')
    const result = res[1].split('/')
    return result
}

export const uniqueNearestB2BCustomers = (Array) => {
    const result = {};
    Array.forEach((item) => {
        const nearestB2BCustomer = item.nearestB2BCustomer;
        if (!result[nearestB2BCustomer.id]) {
            result[nearestB2BCustomer.id] = {
                nearestB2BCustomer: nearestB2BCustomer,
                orders: []
            };
        }
        delete item.distance;
        result[nearestB2BCustomer.id].orders.push(item.order);
    });

    const uniqueNearestB2BCustomers = Object.values(result);
    return uniqueNearestB2BCustomers;
}

export const getLastMonthDate = (date) => {
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return lastDay
}