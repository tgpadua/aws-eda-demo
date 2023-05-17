const { EventBus } = require('/opt/nodejs/event-bus');
const { Database } = require('/opt/nodejs/database');

const database = new Database();
const eventBus = new EventBus();

const eventMapping = new Map([
    ['PaymentSucceeded','OrderCompleted'],
    ['PaymentFailed', 'OrderCancelled']
]);

/**
 * Sample Lambda function that persist orders in DynamoDB and publish events in EventBridge.
 *
 * DISCLAIMER: This code doesn't handle atomicity between the two operations for the sake of simplicity, so isn't intended to be used in production.
 *
 * @param event
 * @returns {Promise<{statusCode: number}>}
 */
exports.handler = async (event) => {
    //console.log("Received event: ", JSON.stringify(event, null, 2));

    if(event.source === 'payment-service') {

        const paymentEvent = event['detail-type'];
        const orderStatus = eventMapping.get(paymentEvent); // define a new order status based on the payment event
        if(!orderStatus) {
            throw new Error(`Detail type not supported: ${paymentEvent}`);
        }

        const orderId = event.detail.id;
        let order =  await database.retrieveOrder(orderId);
        // update the order
        order.status = orderStatus;
        order.timestamp = new Date().toISOString();

        await database.insertOrder(order);
        await eventBus.publishOrderEvent(order);
    }

    return { statusCode: 200 };
}