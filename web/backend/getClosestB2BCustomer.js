import { Client } from "@googlemaps/google-maps-services-js";

const client = new Client({ apiKey: process.env.GMAPS });

function calculateDistance(order, customer) {
    return new Promise((resolve, reject) => {
        client
            .distancematrix({
                params: {
                    origins: [order.address],
                    destinations: [customer.address],
                    units: "metric",
                    key: "AIzaSyDHy54k_B2YAWzH9JCrJ7D5qycNq_RdBOs"
                }
            })
            .then(response => {
                const distance = response.data.rows[0].elements[0].distance.value;
                resolve(distance);
            })
            .catch(error => {
                reject(error);
            });
    });
}


const uniqueNearestB2BCustomers = (Array) => {
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

async function findNearestB2BCustomer(retailOrders, b2bCustomers) {
    const result = [];
    for (const order of retailOrders) {
        if (order.address) {
            let nearestCustomer = null;
            let nearestDistance = Infinity;

            for (const customer of b2bCustomers) {
                if (customer.address) {
                    try {
                        const distance = await calculateDistance(order, customer);
                        if (distance < nearestDistance) {
                            nearestDistance = distance;
                            nearestCustomer = customer;
                        }
                    } catch (e) {
                        console.log(`Failed to calculate distance: ${e.message}`);
                    }
                }
            }

            if (nearestCustomer) {
                result.push({
                    order: order,
                    nearestB2BCustomer: nearestCustomer,
                    distance: nearestDistance
                });
            }
        }
    }
    return result;
}

export default async function getClosestB2BCustomer(orders, b2b) {

    const findClosestCustomer = async () => {
        const retailOrders = orders.map((order) => {
            const address = `${order.node.billingAddress.address1} ${order.node.billingAddress.address2}, ${order.node.billingAddress.zip}  ${order.node.billingAddress.city}, ${order.node.billingAddress.country}`
            return {
                id: order.node.id,
                address: address,
                order: order.node
            }
        })

        const b2bCustomers = b2b.map((client) => {
            const address = `${client.node.defaultAddress.address1}, ${client.node.defaultAddress.formattedArea}`
            return {
                id: client.node.id,
                address: address,
                b2bCustomer: client.node
            }
        })

        try {
            const result = await findNearestB2BCustomer(retailOrders, b2bCustomers); // Await and store the result
            return result; // Return the result instead of a string
        } catch (error) {
            throw error;
        }
    }

    try {
        const data = await findClosestCustomer()
        return data;
    } catch (error) {
        throw error;
    }
}