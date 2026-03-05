const nodemailer = require('nodemailer');
const pug = require('pug');
const { htmlToText } = require("html-to-text");


//Whenever you want to send a new email is to import this email class and then you use it
//new Email(user, url).sendWelcome();
//user contain the user name and email.. url(eg: contain reset url for reset password)
module.exports = class Email{
    constructor(user, url) {
        this.to =user.email;
        this.firstName = user.name.split(' ')[0];
        this.url = url;
        this.from = `Prince Mathew <${process.env.EMAIL_FROM}>`;
    }

    newTransport() {
        if(process.env.NODE_ENV === 'production'){
           //SENDGRID
           return nodemailer.createTransport({
            service: 'SendGrid',
            auth:{
                user: process.env.SENDGRID_USERNAME,
                pass: process.env.SENDGRID_PASSWORD
            }
           })
        }
        return nodemailer.createTransport({
         host: process.env.EMAIL_HOST,
         port: process.env.EMAIL_PORT,
         auth: {
         user: process.env.EMAIL_USERNAME,
         pass: process.env.EMAIL_PASSWORD
     }

    });

}

async send(template, subject){
    //send the actual email
    //1) Render the HTML based on a pug template
    const html = pug.renderFile(
        `${__dirname}/../views/email/${template}.pug`,
        {
            firstName: this.firstName,
            url: this.url,
            subject
        }
    );

     //2) Define the email options
    const mailOptions = {
        from: this.from,
        to: this.to,
        subject,
        html,
        text: htmlToText(html)
    };
    //3) Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
}

async sendWelcome(){
    //welcome.pug template
    await this.send('welcome', 'Welcome to the natours family');
}

//Function from authController forgetPassword
async sendPasswordReset(){
    //passwordReset.pug template
    await this.send(
        'passwordReset',
        'Your password reset token (valid for only 10 minutes)'
    );
}
};


