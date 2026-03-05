const { JsonWebTokenError } = require("jsonwebtoken");
const AppError = require("../utils/appError");

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new AppError(message, 404);
};
const handleDuplicateFieldsDB = err => {
    const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
    console.log(value);
    const message =`Duplicate field value: ${value}. please use another value`;
    return new AppError(message, 400);
};
const handleValidationErrorDB = err =>{
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `invalid input data. ${errors.join('. ')}`;
    return new AppError(message,400);
}

const handleJWTErr = () => new AppError('Invalid token please log again', 401);

const handleJWTExpiredErr = () =>
    new AppError('Your Token Expired Please login again', 401);
//API
const sendErrorDev = (err, req, res) => {
    if(req.originalUrl.startsWith('/api')){
        return res.status(err.statusCode).json({
        status : err.status,
        error: err,
        message: err.message,
        stack: err.stack
    });
    } 
        ///Rendered Website
        console.error('ERROR!!', err);
        return res.status(err.statusCode).render('error', {
            title: 'Something went wrong!',
            msg: err.message
        })
    
    
};
const sendErrorprod = (err, req, res) => {
    //A) API
    if(req.originalUrl.startsWith('/api')){
        //1) Operational, trusted error: send message to client
    if(err.isOperational){
        return res.status(err.statusCode).json({
        status : err.status,
        message: err.message
    });
    } 
    //2) Programming or other unknown error: Don't leak error details
        //1) Log error
        console.error('ERROR!!', err);

        //2) Send generic message
        return res.status(500).json({
            status: 'error',
            message: 'Something went Wrong'
        });
    }
    
        //B) Rendered Website
        //1) Operational, trusted error: send message to client
         if(err.isOperational){
         return res.status(err.statusCode).render('error', {
            title: 'Something went wrong!',
            msg: err.message
        });
    } 
        //2) Programming or other unknown error: Don't leak error details
        //1) Log error
        console.error('ERROR!!', err);

        //2) Send generic message
        return  res.status(err.statusCode).render('error', {
            title: 'Something went wrong!',
            msg: 'Please Try again later.'
        });
    
    
    
    
};
module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if(process.env.NODE_ENV === 'development'){
        sendErrorDev(err, req, res);
    }
    else if(process.env.NODE_ENV === 'production'){
        let error = { ...err };
        error.message = err.message;

        if(error.name === 'CastError') error = handleCastErrorDB(error);
        if(error.code === 11000) error = handleDuplicateFieldsDB(error);
        if(error.name === 'ValidationError') error = handleValidationErrorDB(error);
        if(error.name === 'JsonWebTokenError') error = handleJWTErr();
        if(error.name === 'TokenExpiredError') error = handleJWTExpiredErr();
        sendErrorprod(error, req, res);
    }
}