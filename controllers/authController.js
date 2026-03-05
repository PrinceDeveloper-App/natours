const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Email = require("../utils/email");

const signToken = id => jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });

const createSendToken = (user, statusCode, res) =>{
    const token = signToken(user._id);
//Recieve the cookies, store it and send back along with every request
const cookieOptions = {
        expiresIn: new Date(
            Date.now() + process.env.JWT_EXPIRES_IN * 24 * 60 * 60 *1000
        ),
        httpOnly: true //so this will make the cookies cannot be accessed or modified by the browser..It is important to prevent cross site scripting atack..
    }

    if(process.env.NODE_ENV === 'production') cookieOptions.secure = true;

    res.cookie('jwt', token, cookieOptions);
    //remove the password from the outputS
    user.password = undefined;

     res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });

}

exports.signup = catchAsync(async(req, res, next) => {
    // const newUser = await User.create({
    //     name: req.body.name,
    //     email: req.body.email,
    //     password: req.body.password,
    //     passwordConfirm: req.body.passwordConfirm
    // });
    const newUser = await User.create(req.body);
    const url = `${req.protocol}://${req.get('host')}/me`;
    await new Email(newUser, url).sendWelcome();
    createSendToken(newUser, 201, res);

});

exports.login = catchAsync(async(req, res, next) =>{
    const { email, password } = req.body;
    
    //1.check if email and password exist
    if(!email || !password){
       return next(new AppError('Please provide email and password!', 400));

    }
    //2. Check if user exists && password correct
    const user = await  User.findOne({ email }).select('+password')
    
    if(!user || !(await user.correctPassword(password, user.password))){
        return next(new AppError('Incorrect email or Password', 401));
    }

    //3. If everything okay send token to client
    createSendToken(user, 200, res);

});

exports.logout = (req, res) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });
    res.status(200).json({ status: 'success' });
}

exports.protect = catchAsync(async(req, res, next) => {
    //1) Getting token and check if it's there
    let token;
    if(req.headers.authorization && 
        req.headers.authorization.startsWith('Bearer')
     ) {
        token = req.headers.authorization.split(' ')[1];
     } else if (req.cookies.jwt){
        token = req.cookies.jwt;
     }
     
   // console.log(token); 
     if(!token){
        return next(
            new AppError('You are not logged in! Please log in to access.', 401)
        );
     }

    //2) Verification Token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    
    //3) check if user still exists
    const currentUser = await User.findById(decoded.id);
    if(!currentUser){
        return next(new AppError('The user belonging to the token not exist', 401
        )
    );
    }
    //4) check if user changed password after the token if issued
    if(currentUser.changedPasswordAfter(decoded.iat)){
       return next(new AppError('user recently changed password! Please Login again.', 401)
    ); 

    }
    //Grant Access to protected route
    req.user = currentUser;
    res.locals.user = currentUser;
    next();
});

//Only for rendored pages, No errors
exports.isLoggedIn = catchAsync(async(req, res, next) => {
    //1) Getting token and check if it's there
    
    if (req.cookies.jwt){
     
   try {
        
    
    //2) Verification Token
    const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);
    
    //3) check if user still exists
    const currentUser = await User.findById(decoded.id);
    if(!currentUser){
        return next();
    }
    //4) check if user changed password after the token if issued
    if(currentUser.changedPasswordAfter(decoded.iat)){
       return next(); 
    }
    //There is a logged in user and put that user in to res.locals
    res.locals.user = currentUser;
    return next();
} catch (err) {
    return next();
}
}
next();
});
exports.restrictTo = (...roles) => {
    //this is the middleware function itsels...this fuction basically get access to the roles parameters 
    return (req, res, next) => {
        // roles ['admin', 'lead-guide']. roles='user'(not in this array so its does not have the permission to access)
        if(!roles.includes(req.user.role)){
            return next(new AppError('You do not have the permission to perform this action', 403));
        }
        //if its included its pass into the next middleware. Tht will perform the route handler itself
        next();
    };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
    //1) Get user based on posted email
    const user =await User.findOne({ email: req.body.email });
    if(!user) {
        return next(new AppError('There is no user with email address', 404));
    }

    //2) Generate the random reset token
    //wants to use an instant method.. which has to do with the user data itself.. we gone write bit of code.. 
    //if it a one line code we could write here.. but we need to write a couple of lines of code
    //It more cleaner to seperated into its own functions...
    //That ussually mongoose is the best option for this...
    // So we write this on user model..(userSchema.methods.createPasswordResetToken)

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    //3) Send It to users email
    
    
    try {
        const resetUrl = `${req.protocol}://${req.get(
        'host'
        )}/api/v1/users/resetPassword/${resetToken}`;
        await new Email(user, resetUrl).sendPasswordReset();

        res.status(200).json({
            status: 'success',
            message: 'Token sent to Email!'
        });

    } catch(err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new AppError('There was an error sending the email. Try again later!', 500));
    }
   

});

exports.resetPassword = catchAsync(async (req, res, next) => {
    //1)Get User based on the token
    const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token) //parameter from the URL resetPassword
    .digest('hex');
    //we only know the token, not any other informations about the user.. 
    // so we need to identify the user based on the token form the database
    const user = await User.findOne({ 
        passwordResetToken: hashedToken, 
        passwordResetExpires: { $gt: Date.now() } 
    });
    
    //2) If token has not expired, and there is user, set the new password
    if(!user) {
        return next(new AppError('Token is invalid or has expired', 400));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    //3) Update changedPassword at property for the user


    //4) Log the user in, send JWT
    createSendToken(user, 200, res);

});

exports.updatePassword = catchAsync(async (req, res, next) => {
    // 1) Get user from the collection
    const user = await User.findById(req.user.id).select('+password');


    // 2) Check if POSTed current password is correct
    if(!(await user.correctPassword(req.body.passwordCurrent, user.password))){
        return next(new AppError('Your current password is wrong.', 401));
    }
    // 3) If so, update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;//Validation done automatically by validator.. on save
    await user.save();//Not off the validator...because now check the password is same as the confirm password
    // User.findByIdAndUpdate will not work as intended
    // 4) Log user in, Send JWT
    createSendToken(user, 200, res);

});


