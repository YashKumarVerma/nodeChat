// import express
const express=  require("express");

// to save data betwene pages
const session= require("express-session");

// to get data from post requests
const bodyParser = require('body-parser');

// load the url specific functions
const unfolder = require("./includes/urlUnfold.js");

// load the parser to get details about the docs
const Meta  = require("html-metadata-parser");

// start express app
const app = express();

// templating engine
app.set('view engine', 'hbs');

// to get data fro post
app.use(bodyParser.urlencoded());

// allow content from public
app.use(express.static('public'));

// configure sessions
app.use(session({secret:'260f4f9d19a5c96aa79983876a3e3767'}));


// defining routes
app.get('/', function (req, res){
// prepare data to send to template
    data = {
        title:"Chat",
        message:"my experiments with node"
    };

    // rendr a template
    return res.render("login", data);
});

app.post("/", function(req, res){
    data = {
        title:"nodeChat",
        message:"my experiments with node",
        username:req.body.username
    };

    return res.render("dashboard",data);
});

// make server listen on 3000
server = app.listen(3000);

// link the sockets to server
const io = require('socket.io')(server)


// make server 'listen' for events
io.on("connection", function(socket){
    console.log("New Node Connected");


    // to tell about new user to everyone
    socket.on('newUser', function(data){
        console.log("New User : " + data.username);
        const timeStamp = Math.floor(Date.now() / 1000);
        io.sockets.emit('newUser', {username:data.username, timestamp:timeStamp});
    });

    // to 'push' more messages into server
    socket.on('newMessage', function(data){

        // by default, there's no payload and type is message
        data.type = 'message';
        data.payload = null;
        
        // emit the message as it is
        io.sockets.emit("newMessage", data);

        
        // if there's a url in the message string
        if(unfolder.containsUrl(data.messageString)){
            // set the type to url
            data.type = 'url';

            // get the first url that occurs in string
            var urls = unfolder.getUrl(data.messageString);
            var url = null;
            
            if(unfolder.isArray(urls)){
                url = urls[0];
            }
            
            // load the description of the url
            var description = null;

            // keep everythng inside to make it run one after the another
            Meta.parser(url, function (err,result){           
                description = result;
            
                // and send specific data through payload
                data.payload = {
                    url: url,
                    description: description
                };

                // yell in the terminal about it
                console.log("url hit us !");

                // emit the thing
                io.sockets.emit("newMessage", data);
            });            
        }
    });
});

