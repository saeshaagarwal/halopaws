
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
var nodemailer = require('nodemailer');
const querystring = require('querystring');

//const port = process.argv[2] || 9000;
const port = process.env.PORT || 3000;
const fromEmail = process.env.fromEmail || "contacthalopaws@gmail.com";
const toEmail = process.env.toEmail || "halopawsdonations@gmail.com";

const transporter = nodemailer.createTransport({
  service: 'gmail',//smtp.gmail.com  //in place of service use host...
  secure: false,//true
  port: 25,//465
  auth: {
    user: fromEmail,
    pass: process.env.contactPassword
  }, tls: {
    rejectUnauthorized: false
  }
});

http.createServer(function (req, res) {
  console.log(`${req.method} ${req.url}`);

  if (req.method === 'POST') {
    var body = '';

    req.on('data', function(chunk) {
        body += chunk;
    });

    req.on('end', function() {
        if (req.url === '/contact') {
            console.log('Received message: ' + body);
            var qs = querystring.parse(body);
            let message = `
                            <h1><strong>Contact Form</strong></h1>
                            <p>Hi,</p>
                            <p>${qs.name} contacted with the following Details</p>
                            <br/>
                            <p>Email: ${qs.email}</p>
                            <p>Phone: ${qs.phone}</p>
                            <p>Message: ${qs.message}</p>
                            `

            var mailOptions = {
              from: fromEmail,
              to: toEmail,
              subject: 'Contact Form Submission',
              text: message
            };
            
            transporter.sendMail(mailOptions, function(error, info){
              if (error) {
                console.log(error);
                res.writeHead(500, 'Error', {'Content-Type': 'text/plain'});
                res.end();
              } else {
                console.log('Email sent: ' + info.response);
                res.writeHead(200, 'ok', {'Content-Type': 'text/plain'});
                res.end();
              }
            });
        }  else {
              res.writeHead(200, 'OK', {'Content-Type': 'text/plain'});
              res.end();
        } 
    });
} else {

  // parse URL
  const parsedUrl = url.parse(req.url);
  // extract URL path
  let pathname = `.${parsedUrl.pathname}`;
  // based on the URL path, extract the file extention. e.g. .js, .doc, ...
  const ext = path.parse(pathname).ext || ".html";
  // maps file extention to MIME typere
  const map = {
    '.ico': 'image/x-icon',
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword'
  };

  fs.exists(pathname, function (exist) {
    if(!exist) {
      // if the file is not found, return 404
      res.statusCode = 404;
      res.end(`File ${pathname} not found!`);
      return;
    }

    // if is a directory search for index file matching the extention
    console.log ("pathname = " + pathname)
    if (fs.statSync(pathname).isDirectory()) {
        if (!pathname.endsWith("/")) {
            pathname += "/";
        }
        pathname += 'index' + ext;
    }

    // read file from file system
    fs.readFile(pathname, function(err, data){
      if(err){
        res.statusCode = 500;
        res.end(`Error getting the file: ${err}.`);
      } else {
        // if the file is found, set Content-type and send data
        res.setHeader('Content-type', map[ext] || 'text/plain' );
        res.end(data);
      }
    });
  });

}
}).listen(parseInt(port));

console.log(`Server listening on port ${port}`);
