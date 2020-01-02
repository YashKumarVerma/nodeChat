// import express
const express= require("express");

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

// connect to database
const Sequelize = require('sequelize');


// load configurations
require('dotenv').config()


// conenct to database
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: 'mysql',
  logging: false
});

// test the connection
sequelize.authenticate().then(() => {
  console.error('Database Connected');
}).catch((err) => {
  console.error(err);
});

// model to insert messages into messagestore table
const messagestore = sequelize.define('messagestore', {
  fromUser: {
    type: Sequelize.STRING(64),
  },
  timestamp: {
    type: Sequelize.INTEGER(10),
  },
  message: {
    type: Sequelize.STRING(1024),
  },
  type: {
    type: Sequelize.STRING(3),
  },
  og_url: {
    type: Sequelize.STRING(1024),
  },
  og_title: {
    type: Sequelize.STRING(128),
  },
  og_desc: {
    type: Sequelize.STRING(10000),
  }
}, {
  timestamps: false,
  freezeTableName: true,
});

// templating engine
app.set('view engine', 'hbs');

// to get data fro post
app.use(bodyParser.urlencoded());

// allow content from public
app.use(express.static('public'));

// configure sessions
app.use(session({secret:process.env.SESSION_SECRET}));


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

app.post('/', function(req, res){
    data = {
        title:"nodeChat",
        message:"my experiments with node",
        username:req.body.username
    };

    return res.render("dashboard",data);
});

// function to give all old messages
app.get('/messageDump', (req, res) => {
  messagestore.findAll({
    order: [
      ['id','ASC'],
    ],
  }).then((messages) => {
    const data = JSON.parse(JSON.stringify(messages, null, 4));
    return res.json(data);
  });
});

// make server listen on 3000
server = app.listen(process.env.PORT || 3000);

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

        // save data to database
        messagestore.create({
          fromUser: data.sender,
          timestamp: Math.floor(Date.now() / 1000),
          message: data.messageString,
          og_desc: '',
          og_title: '',
          og_url: '',
          type: 'msg',
        }).then((err) => {
          console.log("Writing message to database");
          console.log(err);
        });

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

                // save the item in database
                // save data to database
                messagestore.create({
                  fromUser: data.sender,
                  timestamp: Math.floor(Date.now() / 1000),
                  message: data.messageString,
                  type: 'url',
                  og_desc: data.payload.description.og.description,
                  og_title: data.payload.description.meta.title ,
                  og_url: data.payload.description.og.url
                }).then((err) => {
                  console.log("Writing URL to database");
                  console.log(err);
                });


                // emit the thing
                io.sockets.emit("newMessage", data);
            });            
        }
    });
});
