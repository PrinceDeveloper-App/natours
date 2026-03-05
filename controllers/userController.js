const multer = require('multer');
const sharp = require('sharp');
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const factory = require('./handlerFactory');

// const multerStorage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'public/img/users');
//     },
//     filename: (req, file, cb) => {
//         // user-userid-timestamp.filetype
//         const ext = file.mimetype.split('/')[1];
//         cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//     }
// });

const multerStorage = multer.memoryStorage();

//To test the uploaded file is an image
const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new AppError('Not an Image! Please upload only images.', 404), false);
    }
}

//upload -just define a couple of settings.. here define the destination of the file to be stored
//By using the upload create a middle ware
const upload = multer({ 
    storage: multerStorage,
    fileFilter: multerFilter
 });

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) =>{
    if(!req.file) return next();

    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
    await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);
    next();
});

const filterObj = (obj, ...allowedFields) =>{
    //Loop the Object...return the array containing all the key names.. 
    // so the field names of the obj and then we can loop them
    //(el =>{ ... }) A call back function
    const newObj = {};
    Object.keys(obj).forEach(el => {
        //newObj(new object) with the field name of the current field should be equel to what ever is in the object at the current field name
        if(allowedFields.includes(el)) newObj[el] = obj[el];
    })
return newObj;
}

exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
}

exports.updateMe = catchAsync(async (req, res, next) =>{
    
    // 1) Create error if user POSTS password data
    if(req.body.password || req.body.passwordConfirm){
        return next(
            new AppError(
                'This rout is not for password update. Please use updateMyPassword.',
                400
            )
        );
    }

    // 2) Filtered out unwanted fields names that are not allowed to updated
    const filterBody = filterObj(req.body, 'name', 'email');
    //filename save to the db
    if (req.file) filterBody.photo = req.file.filename;
    //if you dealing with non-sensitive data like name and email etc. .. you can use findByIdAndUpdate
    // X:- only update the content on the body (now the name and email) Not update the role and some thing like that..
    
    //2) Update user document
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filterBody, {
        new: true,
        runValidators:true
    });
    

    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser
        }
    });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { active: false });

        res.status(204).json({
            status: 'success',
            data: null
        });
   
})

exports.CreateUser = (req, res) => {
    res.status(500).json({
        status: 'fail',
        message: 'This route is not yet defined! Please use Sign Up'
    })
}
exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
//Do not update passwords with this!
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);