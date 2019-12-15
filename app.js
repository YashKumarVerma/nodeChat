// import express
const express=  require("express");

// to save data betwene pages
const session= require("express-session");

// to get data from post requests
const bodyParser = require('body-parser');

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
const io = require("socket.io")(server)


// make server 'listen' for events
io.on("connection", function(socket){
    console.log("New Node Connected");
    
    // to 'push' more messages into server
    socket.on("newMessage", function(data){
        console.log("new message transmitted", data);
        io.sockets.emit("newMessage", {messageString:data.messageString});
    });
});

