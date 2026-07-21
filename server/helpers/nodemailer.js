var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'issaservices45@gmail.com',
    pass: 'pnikgpogfergfief',
  },
});

const sendMail = (student) => {
  var mailOptions = {
    from: 'issaservices45@gmail.com',
    to: student.User.email,
    subject: 'SPP payment',
    html: `
      <h1 style="text-align:center; font-wight:bold;"> ISSA </h1>
      Hallo, ${student.name}'s parent.
      Thanks for complete payment
      <br>
    `,
  };
  transporter.sendMail(mailOptions, function (error, info) {
    console.log(user);
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
};

module.exports = sendMail;
