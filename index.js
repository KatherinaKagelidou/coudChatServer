//Gruppe K
//@author Marek Mauser, 731184
//@author Katherina Kagelidou, 731638

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Cloudant = require('cloudant');

var cloudant;

app.use('/', express.static(__dirname));

app.get('/', function(req, res) {
	res.sendfile('index.html');
});

/* function-call to bind to our Cloudant NoSQL Database */

init();

//array for our clients "user"
users = [];


io.on('connection', function(socket) {

	socket.on('setUsername', function(data) {

		console.log(data + " " + 'connected');

		//If the Username exisit a message appears
		// Array of our clients will be by every new connection
		//to our server at zero. Becaufe we don't save our clients
		// in a database.

		if (users.indexOf(data) > -1) {
			socket.emit('userExists', data
					+ ' username is taken! Choos an other username.');
		} else {
			//set a key for our value which would be the username 
			//to identify every client exactly
		
			
			
			//database
			database.insert({_id:data}, function (error, body){


	

				if (data in users) {//check if username is already in the array

				

					}else { //if its not in the array add it in the array

					
						socket.nickname = data;
						users[socket.nickname] = socket;
						io.sockets.emit('setUsername', Object.keys(users));

						// users.push(data);

						socket.emit('userSet', {
							username : socket.nickname
			
						});
						
						//message is going out which user connected
						//message will be read by every client except the sender
						socket.broadcast.emit('login', socket.nickname);

					}

				

			});
			

		}

		//message is going out which user disconnected
		//message will be read by every client except the sender

		socket.on('disconnect', function(socket) {

			// delete user which disconnected from array
			// var index = users.indexOf(data);
			// delete users[index];

			io.sockets.emit('disconnection', data);
			console.log(data + " disconnected");

            //delete disconnected user from array
			delete users[data];
			//update users with their usernames after disconnection
			io.sockets.emit('setUsername', Object.keys(users));

		});

	});

	// Every Client will get the message 
	// except the private one. For private message
	//the command have to look like: "/p [username] {message]"
	//for example: /p Tesla hallo na wie geht es dir?

	socket.on('msg', function(data, callback) {
		//ignore white space 
		var msg = data.trim();
		//substr 0 for /, 1 for p, 3 for empty space
		if (msg.substr(0, 3) === '/p ') {
			msg = msg.substring(3);
			var ind = msg.indexOf(' ');
			//username should be before message text
			if (ind !== -1) {
				var userName = msg.substring(0, ind);
				var msg = msg.substring(ind + 1);
				if (userName in users) {
					//send the private message to the appropriate user
					users[userName].emit('private', {
						msg : msg,
						nick : socket.nickname
					});
					console.log('private message is going out by ' + socket.nickname);
				} else {
					//callback send a text back to the client as an answer
					callback('Please enter a valid user!')
				}
			} else {
				callback('Please enter a message!');
			}
		} else {
			// message for everyone 
			io.sockets.emit('newmsg', {
				msg : msg,
				nick : socket.nickname
			});
			// list of users
			socket.emit('list', Object.keys(users));
			console.log(users);
		}

	});

});

/* in this function we first try to specify the environment we are running our system on (Bluemix or localy)

on bluemix the enviromental variable is used to get the existing services on bluemix 

from there we can access our Cloudant NoSQL Database

 */

function init() {

    if (process.env.VCAP_SERVICES) {

        services = JSON.parse(process.env.VCAP_SERVICES);

        var cloudantService = services['cloudantNoSQLDB'];

        for (var service in cloudantService) {

        	if (cloudantService[service].name === 'coudChatServer') {

                cloudant = Cloudant(cloudantService[service].credentials.url);

            }

        }

    }

    else {

    	var cloudant = Cloudant({

    		"username": "73bb44a7-c8d7-475f-9d79-d9c018c81f6c-bluemix",

    		"password": "34e4b92c18c2664dc54c6a8c7e9be8c1b978ad7a4ae8a44a5c6de0b615566cfd",

    		"host": "73bb44a7-c8d7-475f-9d79-d9c018c81f6c-bluemix.cloudant.com",

    		"port": 443,

    		"url": "https://73bb44a7-c8d7-475f-9d79-d9c018c81f6c-bluemix:34e4b92c18c2664dc54c6a8c7e9be8c1b978ad7a4ae8a44a5c6de0b615566cfd@73bb44a7-c8d7-475f-9d79-d9c018c81f6c-bluemix.cloudant.com"

    	});

    }

    database = cloudant.db.use('chatserver');

    if (database === undefined) {

    	console.log("ERROR: The database is not defined!");

    }
    else{
    	console.log("connection succesfull");
    }

}




http.listen(8080, function() {
	console.log('listening on localhost:8080');
});







