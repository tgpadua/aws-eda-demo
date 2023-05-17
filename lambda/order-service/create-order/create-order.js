const { EventBus } = require('/opt/nodejs/event-bus');
const { Database } = require('/opt/nodejs/database');

const database = new Database();
const eventBus = new EventBus();

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

    const body = JSON.parse(event.body);
    const order = {
        id: body.id,
        amount: body.amount,
        status: 'OrderCreated',
        timestamp: new Date().toISOString()
    }

    await database.insertOrder(order);
    await eventBus.publishOrderEvent(order);

    return { statusCode: 202 };
}