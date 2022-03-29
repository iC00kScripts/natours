const Stripe = require('stripe');
const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('./../utils/appError');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  //get the tour booked
  const bookedTour = await Tour.findById(req.params.tourId);

  //create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${bookedTour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        name: `${bookedTour.name} Tour`,
        description: bookedTour.summary,
        images: [`https://www.natours.dev/img/tours/${bookedTour.imageCover}`],
        amount: bookedTour.price * 100,
        currency: 'usd',
        quantity: 1,
      },
    ],
  });

  //send to client as response
  res.status(200).json({
    status: 'success',
    session,
  });
});