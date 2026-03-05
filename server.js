
const mongoose = require('mongoose');
const dotenv = require('dotenv'); 

process.on('uncaughtException', err =>{
    console.log(err.name, err.message);
    console.log('UNCAUGHT EXCEPTION! Shutting down...');
        process.exit(1);
});

dotenv.config({path: './config.env'});
const app =require('./app');



const DB = process.env.DATABASE.replace('<PASSWORD>',  process.env.DATABASE_PASSWORD);

mongoose
//.connect(process.env.DATABASE_LOCAL, {
.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
}).then(() =>  console.log('DB CONNECtion Successful!'));

// }).then(con =>{
//     console.log(con.connections);
//     console.log('DB CONNECtion Successful!');
// });

//console.log(process.env);

const port = process.env.PORT || 3000;
const server = app.listen(port, () =>{
    console.log(`App running on port ${port}...`);
});
process.on('unhandledRejection', err =>{
    console.log(err.name, err.message);
    console.log('UNHANDLED REJECTION! Shutting down...');
    server.close(() => {
        process.exit(1);
    });
});

