const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
//const User = require('./userModel');
//Creating mongoose scheema
const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        reuired: [true, 'A tour must have a name'],
        maxlength: [40, 'A tour must have a less or equel then 40 characters'],
        minlength: [10, 'A tour must have a more or equel then 10 characters'],
        unique: true,
        trim: true
    },
    slug: String,
    duration: {
        type: Number,
        required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
        type: Number,
        required: [true, 'A tour must have a maximum group size']

    },
    difficulty: {
        type: String,
        enum: {
            values: ['easy', 'medium', 'difficult']
        }
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, 'Ratings must have above 1'],
        max: [5, 'Ratings must have below 5'],
        set: val => Math.round(val * 10) / 10 //4.666, 46.666, 47, 4.7
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, 'A tour must have a price']
    },
    priceDiscount: {
        type: Number,
        validate: {
            validator: function(val){
                //this only points to current document on new document creation
                return val < this.price
            },
            message: 'Discount price({VALUE}) should be below regular price'
        }
    },
   
    summary: {
        type: String,
        trim: true,
        required: [true, 'A tour must have a description']
    },
    description: {
        type: String,
        trim: true
    },
    imageCover: {
        type: String,
        required: [true, 'A tour must have a cover image']
    },
    images: [String],
    createdAt: {
        type: Date,
        default: Date.now()
    },
    startDates: [Date],
    secretTour:{
        type: Boolean,
        default: false
    },
    startLocation: {
        //Geo JSON
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String
    },
    locations: [
        {
        //Geo JSON
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
    }
],
//embedding
  //guides: Array
  //Referencing: Child
  guides: [
    { 
        type: mongoose.Schema.ObjectId,
        ref: 'User'
     }
  ]
},

{
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
}
);

tourSchema.virtual('durationWeeks').get(function(){
return this.duration/7;
});

//Indexing
tourSchema.index({price: 1, ratingsAverage: -1});
tourSchema.index({slug: 1});
tourSchema.index({ startLocation: '2dsphere' });

//Virtual Populate
tourSchema.virtual('reviews', {
    //import model name
    ref:'Review',
    //field name on reviewModel.js
    foreignField: 'tour',
    //field name in tourModel
    localField: '_id'
})
//DOCUMENT MIDDLEWARE: before .save() and .create()

tourSchema.pre('save', function(next){
    this.slug = slugify(this.name, {lower: true});
    next();
});

///Embedding Tour guides
// tourSchema.pre('save', async function(next) {
//     const guidesPromises = this.guides.map(async id => await User.findById(id));
//     this.guides = await Promise.all(guidesPromises);
//     next();
    
// })
/// QUERY MIDDLEWARE
tourSchema.pre(/^find/, function(next){
    this.find({secretTour: { $ne: true }});
    //this.start = Date.now();
    next();
});
tourSchema.pre(/^find/, function(next){
    this.populate({
            path: 'guides',
            select: '-__v -passwordChangedAt'

        });
        next();
});
// tourSchema.post(/^find/, function(docs, next){
//     console.log(`Query took ${Date.now() - this.start} milliseconds!`);
//     next();
//     });
///AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function(next){
//     this.pipeline().unshift({$match: {secretTour: { $ne: true }}});
//     console.log(this.pipeline());
//     next();
// });

//Creating mongoose model
const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;