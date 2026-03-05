const path =require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');
//const { title } = require('process');

const app = express();

//Setting up template engine PUG
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//1) Global MIDDLE WIRES
//Serving Static Files
app.use(express.static(path.join(__dirname, 'public')));
//Set security HTTP headers
app.use(helmet());

//Development Logging
//console.log(process.env.NODE_ENV);
if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'));
}

//Limit Request for same API
const limiter = rateLimit({
    //allow 100 request from same IP In 1 Hour
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many request from this IP, please try again in an hour!'
});
// Means this middleware works only the url starts /api
app.use('/api', limiter);

//Body Parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
//reading data from url
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

//Data sanitization against NoSQL query injection
app.use(mongoSanitize());

//Data Sanitization against xss..prevent html, css
app.use(xss());

//HTTP Parameter pollution
app.use(hpp({
    whitelist: [
        'duration', 
        'ratingsAverage', 
        'ratingsQuantity', 
        'price', 
        'difficulty', 
        'maxGroupSize'
    ]
}));

// app.use((req, res, next) => {
//     console.log('Hello from the middleware');
//     next();
// });

//Test Middleware
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    // console.log(req.cookies);
    next();
})
//3) ROUTS
app.use('/', viewRouter);//view Router Middle Ware
app.use('/api/v1/tours', tourRouter);//Tour Router Middleware
app.use('/api/v1/users', userRouter);//User Router Middle Ware
app.use('/api/v1/reviews', reviewRouter);//Review Router Middle Ware
app.use('/api/v1/bookings', bookingRouter);//Review Router Middle Ware

app.all('*', (req, res, next) =>{
    next(new AppError(`Cont't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
