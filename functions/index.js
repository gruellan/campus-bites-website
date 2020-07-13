'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const stripe = require('stripe')(functions.config().stripe.token);
const currency = functions.config().stripe.currency;

const firestore = admin.firestore();
const messaging = admin.messaging();
const settings = { timestampsInSnapshots: true };
firestore.settings(settings);

const usersCollectionRef = firestore.collection('users');
const restaurantsCollectionRef = firestore.collection('restaurants');
const ordersCollectionRef = firestore.collection('orders');
const collegesCollectionRef = firestore.collection('colleges');

//Send grid Dependencies
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(functions.config().sendgrid.key);

const formatPrice = (value) => {
  const price = value || 0;
  const pounds = Math.floor(price / 100);
  const pence = price % 100;
  return '£' + pounds + '.' + ('0' + pence).slice(-2);
};

const formatDate = (date) => {
  return new Date(date.seconds * 1000).toLocaleString(undefined, {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const sendMail = async (order) => {
  // Generate basket HTML structure based on orderItems
  let mailBasket = ``;
  for (let i = 0; i < order.orderItems.length; i++) {
    mailBasket = mailBasket + `
    <tr>
      <td>x${order.orderItems[i].quantity} ${order.orderItems[i].name} - ${formatPrice(order.orderItems[i].unitPrice)}</td>
    </tr>`
  }
  mailBasket = mailBasket + `
    <tr>
      <td>Delivery Fee (${order.deliveryLocation.area.name}) - ${formatPrice(order.deliveryLocation.area.fee)}</td>
    </tr>
  `;

  const userSnapshot = await order.user.get();
  const user = userSnapshot.data();
  const chargeSnapshot = await order.charge.get();
  const charge = chargeSnapshot.data();
  const deliveryFee = 150;
  let amount = order.orderItems.reduce((accumulator, item) => accumulator + (item.unitPrice * item.quantity), 0)
  amount += deliveryFee;

  let receiptOrInvoice, textToPrint, paying;
  if (charge.paid) {
    textToPrint = 'Amount paid';
    receiptOrInvoice = 'Receipt';
    paying = 'Paid online';
  } else {
    textToPrint = 'Amount to pay';
    receiptOrInvoice = 'Invoice';
    paying = 'Paying on delivery with cash';
  }

  const mailStyling = (`
  <div style="width:500px; height:auto; font-family:'Segoe UI, Helvetica, Arial, Calibri'; background-color:white; padding:25px; border-radius:5px; box-shadow: 0 0 20px 0 rgba(0, 0, 0, 0.2), 0 5px 5px 0 rgba(0, 0, 0, 0.24);
  margin: 0 auto;">
    <table style="margin-left:auto; margin-right:auto;">
      <tr>
      <td><img style="width:70px; height:70px; border-radius:50%; box-shadow: 0 0 20px 0 rgba(0, 0, 0, 0.2), 0 5px 5px 0 rgba(0, 0, 0, 0.24);"src="https://puu.sh/CVqIQ.png"></img></td>
      </tr>
    </table>
    <h2 style="font-size:30px; color:#32325d; font-weight:100; margin:0; padding:10px 10px 0 10px; text-align:center;">
      ${receiptOrInvoice} from Campus Bites Ltd.
    </h2>
    <h4 style="text-align:center; margin:0; padding:10px 0 20px 0; font-weight:200">${receiptOrInvoice} for order: ${order.orderId}</h4>
    <table style="text-align:center; margin-left:auto; margin-right:auto;">
      <tr>
        <td style="padding:0 20px 0 20px; font-weight:600; font-size:14px; color:#494D4D;">${textToPrint}</td>
        <td style="padding:0 20px 0 20px; font-weight:600; font-size:14px; color:#494D4D;">Date Paid</td>
        <td style="padding:0 20px 0 20px; font-weight:600; font-size:14px; color:#494D4D;">Payment Method</td>
      </tr>
      <tr>
        <td style=" font-weight:100; font-size:14px; color:#494D4D;">${formatPrice(amount)}</td>
        <td style=" font-weight:100; font-size:14px; color:#494D4D;">${formatDate(order.orderTime)}</td>
        <td style=" font-weight:100; font-size:14px; color:#494D4D;">${paying}</td>
      </tr>
    </table>
    <h4 style="font-weight:600; color:#494D4D; margin:0; padding-bottom:5px;">Summary</h4>
    <table style="font-size:14px; padding:15px; width:100%; background-color:#F0F5F5; border-radius:5px;">
      ${mailBasket}
      <td>
        <hr style="border: 0;
          height: 0;
          border-top: 1px solid rgba(0, 0, 0, 0.1);
          border-bottom: 1px solid rgba(255, 255, 255, 0.3);"
        >
      <td>
      </tr>
      <tr style="font-weight:500;">
      <td>
        Amount Paid
      </td>
      <td>
        ${formatPrice(amount)}
      <td>
      </tr>
    </table>
    <hr style="border: 0;
      height: 0;
      border-top: 1px solid rgba(0, 0, 0, 0.1);
      border-bottom: 1px solid rgba(255, 255, 255, 0.3);"
    >
    <p style="font-size:12px;">If you have any questions, please contact us at <br><a href="https://campusbites.co.uk/contact">https://campusbites.co.uk/contact</a>,<br> or reach us directly at <br>admin@campusbites.co.uk</p>
    <hr style="border: 0;
      height: 0;
      border-top: 1px solid rgba(0, 0, 0, 0.1);
      border-bottom: 1px solid rgba(255, 255, 255, 0.3);"
    >
    <p style="font-size:8px;">
    You're receiving this email because you made a purchase at Campus Bites Ltd. Campus Bites Ltd.
    Campus Bites, Enterprise & Innovation Services, Bowland Main, Lancaster University, Lancaster, United Kingdom, LA1 4YT
    </p>
  </div>
  `);
  const mail = {
    to: user.email,
    from: {
      email: 'do-not-reply@campusbites.co.uk',
      name: `Campus Bites`
    },
    subject: `${receiptOrInvoice} for order ${order.orderId}`,
    text: 'Thanks for using Campus Bites!',
    html: mailStyling,
  };
  await sgMail.send(mail);
  console.log(`${receiptOrInvoice} Email sent to user ${order.orderId} ${user.email}`);
};

// Charge the Stripe customer whenever an amount is written to the Realtime database
// [START userCharge]
exports.userCharge = functions
  .region('europe-west1')
  .firestore
  .document('users/{userUid}/charges/{id}')
  .onCreate(async (snap, context) => {
    // Get the data written as a charge to Firestore
    const data = snap.data();
    const { deliveryLocation, paymentInformation } = data;

    const { college, address, instructions, allergies } = deliveryLocation;
    const { source, cash, basket, restaurant, clientAmount, orderId } = paymentInformation;
    console.info('Delivery location:', deliveryLocation);
    console.info('Payment information:', paymentInformation);

    try {
      // Look up the Stripe customer id written in createStripeCustomer
      const userRef = usersCollectionRef.doc(context.params.userUid);
      const userSnapshot = await userRef.get();
      const user = userSnapshot.data();
      const customer = user.stripeCustomerId;

      const duplicateOrders = await ordersCollectionRef.where('orderId', '==', orderId).get();
      if (!duplicateOrders.empty) {
        console.error('Stop processing the charge, it has already been processed');
        return Promise.resolve();
      }

      if (!user.confirmedTC) {
        throw new Error('The user has not accepted T&Cs');
      }

      if (!college || !college.name) {
        throw new Error('The user must specify a college');
      }
      if (!address) {
        throw new Error('The user must specify an address');
      }

      if (!user.email) {
        throw new Error('The user has not specified an email address');
      }
      if (!user.phoneNumber) {
        throw new Error('The user has not specified a phone number');
      }
      if (!user.displayName) {
        throw new Error('The user has not specified their display name');
      }

      if (!basket || basket.length === 0) {
        throw new Error('The basket must not be empty');
      }
      if (!restaurant) {
        throw new Error('No restaurant reference was provided');
      }
      if (clientAmount <= 0) {
        throw new Error('The client basket total must be non-negative');
      }

      // get college object
      const collegesSnapshot = await collegesCollectionRef
        .where('name', '==', college.name)
        .limit(1)
        .get();
      const collegeDocs = collegesSnapshot.docs;
      if (collegeDocs.length === 0) {
        throw new Error(`No college named ${college.name} found`);
      }

      // get delivery fee
      const deliveryFee = 150;
      if (deliveryFee <= 0) {
        throw new Error('Delivery fee must be non-negative');
      }

      // ... get basket items ...
      const foodItemsCollectionRef = restaurant.collection('food-items');

      const orderItems = await Promise.all(basket.map(async (basketItem) => {
        console.info('basketItem:', basketItem);

        if (basketItem.quantity <= 0) {
          throw new Error('Client food item quantity must be non-negative');
        }

        // used to be <= 0, but we need to allow free items (e.g. sauces)
        if (basketItem.price < 0) {
          throw new Error('Client food item price must be non-negative');
        }

        // TODO: cache foodItems and categories
        const foodItem = (await foodItemsCollectionRef.doc(basketItem.id).get()).data();
        const category = (await foodItem.category.get()).data();

        console.info('foodItem:', foodItem);
        console.info('category:', category);

        // this used to be <= 0, but we should allow free items (e.g. sauces)
        if (foodItem.price < 0) {
          throw new Error('Server food item must be non-negative');
        }

        if (foodItem.outOfStock) {
          throw new Error(`${foodItem.name} is out of stock`);
        }

        if (foodItem.name !== basketItem.name) {
          throw new Error('Server and client food item name mismatch');
        }

        // If no deals are provided on the foodItem, copy the deals from
        //  the category instead.
        const deals = foodItem.deals || category.deals || [];

        // Merge the properties from the foodItem with the category's properties.
        //
        // If any property is repeated on the foodItem and category, the foodItem property
        //  will take priority overwriting the category property.
        const properties = category.properties || {};
        if (foodItem.properties) {
          Object.assign(properties, foodItem.properties);
        }

        let orderItemValue = foodItem.price;

        if (basketItem.properties) {
          const basketItemProperties = Object.keys(basketItem.properties);
          console.info('Basket item has properties:', basketItemProperties.join(', '));

          const ignoredProperties = [];
          const unknownProperties = [];

          await Promise.all(basketItemProperties.map(async (property) => {
            const value = basketItem.properties[property];

            // TODO: verify prices are non-negative before adding them to the unit price
            if (property === 'deals') {
              // Processing deals
              console.info(`Processing deal '${property}'`);

              const deal = deals.find(deal => deal.name === value);
              if (!deal) {
                throw new Error(`Could not find deal named '${value}'`);
              }
              console.info('Selected deal:', deal);

              if (deal.price && !deal.free) {
                orderItemValue += deal.price;
              } else {
                throw new Error(`Deal '${value}' was neither free nor did it have a price`);
              }

              if (deal.properties) {
                const dealProperties = Object.keys(deal.properties);
                await Promise.all(dealProperties.map(async (subproperty) => {
                  const dealProperty = deal.properties[subproperty];
                  const subpropertyValue = basketItem.properties[subproperty];
                  console.info(`Processing deal property '${subproperty}' (${dealProperty}): ${subpropertyValue}`);

                  if (!subpropertyValue && !dealProperty.optional) {
                    throw new Error(`Required deal subproperty '${subproperty}' not provided`);
                  }

                  console.info(`Ignoring property '${subproperty}', subproperty of '${property}'`);
                  ignoredProperties.push(subproperty);

                  if (!dealProperty.free) {
                    // TODO: not implemented
                    throw new Error(`Non-free subproperties are not implemented yet (in ${property}/${subproperty})`);
                  }
                }));
              }

              return Promise.resolve();
            } else {
              // Processing properties
              const foodItemProperty = properties[property];
              if (!foodItemProperty) {
                unknownProperties.push(property);
                console.info('Unknown property (not erroring yet):', property);
                return Promise.resolve();
              }
              console.info(`Processing property '${property}': ${foodItemProperty}`);

              if (foodItemProperty.options) {
                // Options food item property (radio buttons)
                console.info(`Processing options food item property '${property}' (radio buttons)`);

                const selectedOption = foodItemProperty.options.find(option => option.name === value);
                if (!selectedOption) {
                  throw new Error(`Unknown option '${value}' for property '${property}' (radio buttons)`);
                }

                if (foodItemProperty.free) {
                  return Promise.resolve();
                }

                if (!selectedOption.price) {
                  throw new Error(`Option '${value}' did not have a price when the property is not free`);
                }

                orderItemValue += selectedOption.price;
                return Promise.resolve();
              } else if (foodItemProperty.items) {
                // Items food item property (checkboxes)
                console.info(`Processing items food item property '${property}' (checkboxes)`);

                const items = basketItem.properties[property];
                if (typeof items !== 'object') {
                  throw new Error(`No value was provided for '${property}' (checkboxes)`);
                }

                if (foodItemProperty.free) {
                  console.info(`Food item property '${property}' is free`);
                  return Promise.resolve();
                }

                await Promise.all(Object.keys(items).map(async (itemName) => {
                  const itemValue = items[itemName];
                  const foodItemItem = foodItemProperty.items.find(item => item.name === itemName);

                  if (!itemValue) {
                    return;
                  }

                  if (!foodItemItem.price) {
                    throw new Error(`Property item '${itemName}' did not have a price when the property '${property}' is not free`);
                  }

                  orderItemValue += foodItemItem.price;
                }));

                return Promise.resolve();
              }
            }
          }));

          unknownProperties.forEach(property => {
            if (ignoredProperties.indexOf(property) < 0) {
              throw new Error(`Could not find property named '${property}' on food item '${foodItem.name}'`);
            } else {
              console.info(`Ignored property '${property}'`);
            }
          });

        }

        // this used to be <= 0, but we need to allow free items (e.g. sauces)
        if (orderItemValue < 0) {
          throw new Error('Server food item (calculated from properties) price must be non-negative');
        }

        const orderItem = {
          name: foodItem.name,
          unitPrice: orderItemValue,
          quantity: basketItem.quantity
        };

        // TODO: calculate label on the server
        // this could be exploited
        // e.g. change the label to say 'Fries' even though the price doesn't include fries...
        if (basketItem.label) {
          orderItem.label = basketItem.label;
        }

        console.log('orderItem:', orderItem);

        return orderItem;
      }));

      const orderItemsTotal = orderItems.reduce((acc, orderItem) => acc + (orderItem.unitPrice * orderItem.quantity), 0);
      const amount = orderItemsTotal + deliveryFee;

      console.log('orderItemsTotal:', orderItemsTotal);
      console.log('deliveryFee:', deliveryFee);
      console.log('amount:', amount);

      if (amount !== clientAmount) {
        throw new Error('The client total is not the same as the server total');
      }

      if (amount <= 0) {
        throw new Error('Your order must contain at least one non-free item');
      }

      if (!cash) {
        // Card payment
        console.log('Card payment');

        // get sources
        const sourcesSnapshot = await userRef
          .collection('sources')
          .get();
        const sourceDocs = sourcesSnapshot.docs;

        let stripeSource = source;
        if (sourceDocs.length <= 1) {
          stripeSource = 'default';
        }

        // Create a charge using the pushId as the idempotency key
        // protecting against double charges
        // SEE: https://stripe.com/docs/api/charges/object

        // TODO: make this legible
        const description = orderItems.map(item => {
          const label = item.label ? `\n(${item.label})` : '';
          return `x${item.quantity} ${item.name}${label} - ${formatPrice(item.price || item.unitPrice)}`;
        }).join('\n') + `\n\nDelivery Fee (${college.name}) - ${formatPrice(college.fee)}`;

        let charge = {
          amount: amount,
          // we don't want to capture payments from admins
          capture: !(user.permissions && user.permissions.admin),
          currency: currency,
          customer: customer,
          // description shown on the receipt
          description,
          // the email address which the receipt will be sent to
          receipt_email: user.email,
          shipping: {
            address: {
              line1: address,
              line2: college.name,
              city: 'Bailrigg',
              state: 'Lancashire',
              country: 'United Kingdom',
              postal_code: 'LA1',
            },
            name: user.displayName,
            phone: user.phoneNumber,
          },
          // statement descriptor: max 22 characters, ASCII only
          statement_descriptor: 'Campus Bites Delivery',
        };
        if (stripeSource && stripeSource !== 'default') {
          charge.source = stripeSource;
        }
        console.info('Charge object:', charge);

        let response = await stripe.charges.create(charge, {
          idempotency_key: context.params.id
        });
        console.info('Stripe response:', response);

        // Check whether or not the payment was successful
        if (response.paid) {
          const order = {
            orderTime: admin.firestore.Timestamp.now(),
            user: userRef,
            charge: userRef.collection('charges').doc(context.params.id),
            deliveryLocation: {
              area: college,
              address: address,
            },
            restaurant: restaurant,
            orderItems: orderItems,
            notes: instructions,
            courier: null,
            completedTime: null,
            cash: false,
            orderId: paymentInformation.orderId,
          };
          console.log('Order object:', order);

          // Add order to the orders collection
          return ordersCollectionRef
            .add(order)
            .then((ref) => {
              response.order = ref;
              return snap.ref.set(response, { merge: true });
            });
        } else {
          // Write the response back to the database
          return snap.ref.set(response, { merge: true });
        }

      } else {
        //Process a reciept for the user if the user pays cash
        console.log('Cash payment');
        //Add a paid false boolean to user object charge
        userRef.collection('charges').doc(context.params.id).update({paid:false});
        //const newChargeData = await userRef.collection('charges').doc(context.params.id).get().data();
        const order = {
          orderTime: admin.firestore.Timestamp.now(),
          user: userRef,
          charge: userRef.collection('charges').doc(context.params.id),
          deliveryLocation: {
            area: college,
            address: address,
          },
          allergies: allergies,
          restaurant: restaurant,
          orderItems: orderItems,
          notes: instructions,
          courier: null,
          completedTime: null,
          cash: true,
          orderId: paymentInformation.orderId,
        };

        return sendMail(order)
          .then(() => ordersCollectionRef.add(order))
          .then((ref) => snap.ref.update({
            order: ref,
            created: Math.floor(order.orderTime.toMillis() / 1000),
            amount,
          }));
      }

    } catch(error) {
      console.error(error);
      return snap.ref.set({ error: error.message ? error.message : JSON.stringify(error) }, { merge: true });
    }
  });
// [END userCharge]

const setError = (ref, error) => {
  console.error(error);
  return ref.set({ error }, { merge: true });
}

exports.orderEvent = functions
  .region('europe-west1')
  .firestore
  .document('/orders/{orderUid}/events/{eventId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const eventRef = snap.ref;
    const type = data.type;
    console.info('Data:', data);

    const courierUid = data.courierUid;
    const courierRef = usersCollectionRef.doc(courierUid);

    const orderUid = context.params.orderUid;
    const orderRef = ordersCollectionRef.doc(orderUid);

    const orderSnap = await orderRef.get();
    const order = orderSnap.data();

    const courier = (await courierRef.get()).data();

    switch (type) {
      // attempt to claim the order
      case 'claim': {
        if (order.courier) {
          return setError(eventRef, 'This order has already been claimed.');
        }

        return orderRef.update({
          courier: courierRef,
          courierClaimTime: admin.firestore.Timestamp.now(),
        });
      }

      // mark order as completed
      case 'complete': {
        if (!order.courier) {
          return setError(eventRef, 'You cannot mark an order as completed if it hasn\'t been claimed.');
        }

        if (order.courier.id !== courierUid && (!courier.permissions || !courier.permissions.admin)) {
          return setError(eventRef, 'You cannot mark an order as completed if you haven\'t claimed it.');
        }

        //Set the order as paid and sent Receipt
        await order.charge.update({paid: true});

        const now = admin.firestore.Timestamp.now();
        return sendMail(order)
          .then(() => orderRef.update({
            completedTime: now,
            duration: now.toMillis() - order.orderTime.toMillis(),
          }));
      }
    }

    return Promise.reject(new Error(`Unknown order event type '${type}'`));
  });

// When a user is created, populate their document in Firestore and register
//  them with Stripe
exports.userCreate = functions
  .region('europe-west1')
  .auth
  .user()
  .onCreate(async (user) => {
    const customer = await stripe.customers.create({ email: user.email });
    return usersCollectionRef.doc(user.uid).set({
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      photoURL: user.photoURL,
      stripeCustomerId: customer.id
    });
  });

// Add a payment source (card) for a user by writing a stripe payment source token to Realtime database
exports.userToken = functions
  .region('europe-west1')
  .firestore
  .document('/users/{userUid}/tokens/{pushId}')
  .onCreate(async (snap, context) => {
    const source = snap.data();
    const token = source.token;
    if (source === null) {
      return null;
    }

    try {
      const userRef = usersCollectionRef.doc(context.params.userUid);
      const snapshot = await userRef.get();
      const customer =  snapshot.data().stripeCustomerId;
      const response = await stripe.customers.createSource(customer, { source: token });

      return usersCollectionRef
        .doc(context.params.userUid)
        .collection('sources')
        .doc(response.fingerprint)
        .set(response, { merge: true });
    } catch (error) {
      console.error(error);
      return snap.ref.set({ error: userFacingMessage(error) }, { merge: true });
    }
  });


// When a user deletes their account, clean up after them
exports.userDelete = functions
  .region('europe-west1')
  .auth
  .user()
  .onDelete(async (user) => {
    const snapshot = await usersCollectionRef.doc(user.uid).get();
    const customer = snapshot.data();
    if (customer.stripeCustomerId) {
      await stripe.customers.del(customer.stripeCustomerId);
    }
    return usersCollectionRef.doc(user.uid).delete();
  });


exports.userNotify = functions
  .region('europe-west1')
  .firestore
  .document('users/{userUid}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Determine whether or not the notification tokens object
    // on this user has changed and if it has find the new
    // token which was added.
    const beforeTokens = Object.keys(before.notificationTokens || {});
    const afterTokens = Object.keys(after.notificationTokens || {});
    if (beforeTokens === afterTokens) {
      return;
    }

    const newToken = afterTokens.find(token => beforeTokens.indexOf(token) < 0);
    if (!newToken || newToken.length === 0) {
      return;
    }

    // Once the new token has been found send a notification
    // to the user so that they know that it works correctly.
    console.info('New token:', newToken);

    const notification = {
      title: 'Campus Bites',
      body: `Hello, ${after.displayName}'s new device!`,
      icon: after.photoURL || 'icons/icon-512x512.png',
      badge: 'icons/badge-128x128.png',
      click_action: 'https://campusbites.co.uk/',
      timestamp: Date.now(),
    };

    const payload = {
      data: {
        notification: JSON.stringify(notification)
      }
    };

    messaging.sendToDevice(newToken, payload)
      .then((response) => {
        const error = response.results ? response.results[0].error : undefined;
        if (error) {
          console.error('Failure sending notification to', newToken, error);
          // Cleanup the tokens who are not registered anymore.
          if (error.code === 'messaging/invalid-registration-token' ||
              error.code === 'messaging/registration-token-not-registered') {
            const update = {};
            update[`notificationTokens.${newToken}`] = admin.firestore.FieldValue.delete();
            return after.ref.update(update);
          }

          return Promise.reject(error);
        }

        const tasks = [];
        for (const topic of Object.keys(after.permissions || {})) {
          console.info('Subscribing to topic:', topic);
          tasks.push(messaging.subscribeToTopic([newToken], topic));
        }

        return Promise.all(tasks);
      })
      .then((result) => console.info(result))
      .catch((error) => Promise.reject(error))
  });


exports.orderNotify = functions
  .region('europe-west1')
  .firestore
  .document('orders/{orderUid}')
  .onCreate(async (snap) => {
    const order = snap.data();

    const restaurant = (await order.restaurant.get()).data();
    const user = (await order.user.get()).data();

    const foodValue = order.orderItems.reduce((total, item) => total + (item.unitPrice * item.quantity), 0);
    const deliveryFee = 150;
    const totalValue = foodValue + deliveryFee;
    const paymentMethod = order.cash ? 'They will pay with cash' : 'They have paid through Stripe';
    const body = `${user.displayName} has placed an order worth ${formatPrice(totalValue)} at ${restaurant.name}. ${paymentMethod}.`;

    const courierNotification = {
      title: 'New order received',
      body,
      icon: 'icons/icon-512x512.png',
      badge: 'icons/badge-128x128.png',
      // take the user to the courier page after they click the notification
      click_action: 'https://campusbites.co.uk/courier',
      timestamp: order.orderTime.seconds * 1000,
    };
    const restaurantNotification = {
      title: 'New order received',
      body,
      icon: 'icons/icon-512x512.png',
      badge: 'icons/badge-128x128.png',
      // take the user to the restaurant dashboard page after they click the notification
      click_action: 'https://campusbites.co.uk/restaurant-dashboard',
      timestamp: order.orderTime.seconds * 1000,
    };

    return messaging.sendToTopic('courier', {
      data: {
        notification: JSON.stringify(courierNotification)
      }
    }).then(() => messaging.sendToTopic('restaurant', {
      data: {
        notification: JSON.stringify(restaurantNotification)
      }
    }));
  });

// Sanitize the error message for the user
function userFacingMessage(error) {
  return error.type ? error.message : 'An error occurred, developers have been alerted';
}
