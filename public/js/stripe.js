/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alert';

const stripe = Stripe('pk_test_51T7KZP2ewrbqN7Q9cuhbWrShzwrRL7w4MvSxpIMNah20zWlK3S14CfwEsTj2OuKQR7GLN7YbWE5FnpszS1g6hUgs00rwir7vvN');

export const bookTour = async tourId => {
    try{
        //1) Get Checkout session from API
        const session = await axios(
            `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`
        );
        console.log(session);

        // 2) Create checkout form + create credit card
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id
        });
    } catch(err) {
        console.log(err);
        showAlert('error', err);
    }
};