var express = require('express');
var fs = require('fs');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server, {transports: ['websocket']});
var Cloudant = require('cloudant');
var redis = require('redis');
var cloudant;

//use port 8080 unless there exists a preconfigured port
var port = process.env.port || 8080;

//our credentials for the database connection
var username = "73bb44a7-c8d7-475f-9d79-d9c018c81f6c-bluemix", 
	password = "34e4b92c18c2664dc54c6a8c7e9be8c1b978ad7a4ae8a44a5c6de0b615566cfd", 	
	cloudant = Cloudant({
	account : username,
	password : password
});

var users = {};

app.enable('trust proxy');

//get path always to https 
app.use(function(req, res, next) {
	if (req.secure) {
		next();
	} else {
		res.redirect('https://' + req.headers.host + req.url);
	}
});

app.use('/', express.static(__dirname));

app.get('/', function(req, res) {
	res.sendfile('index.html');
});

init();

//redis connection with out port, hostname and password
//var client = redis.createClient(17981, 'pub-redis-17981.dal-05.1.sl.garantiadata.com', {no_ready_check: true});
//client.auth('Qo49Fq6cSoqQzgYS', function (err) {
//  if (err) throw err;
//});
//
//client.on('connect', function() {
//  console.log('Connected to Redis');
//});

var client1 = redis.createClient(17981, 'pub-redis-17981.dal-05.1.sl.garantiadata.com');
 client1.auth('Qo49Fq6cSoqQzgYS');

var client2 = redis.createClient(17981, 'pub-redis-17981.dal-05.1.sl.garantiadata.com');
client2.auth('Qo49Fq6cSoqQzgYS');


client1.on('message', function(chan, msg) {
	
	client2.hgetall(msg, function(err, res){
		
		res.key=msg;
		io.sockets.emit('send message',res);
	});
	
	});

	client1.subscribe('chatter');



io.sockets.on('connection', function(socket) {
	socket.on('new user', function(data, callback) {
		socket.on('setPassword', function(password) {
			//if data is in array
			if (data in users) {
				//get the user (if exist)in the database with this password 
				//if the user doesnt exist -->err else get the data 
				database.get(password, function(err, body) {
					console.log("Error:", err);
					console.log("Data:", body);
					if (err) {
						callback(false);
					} else {
						callback(true);
						socket.nickname = data;
						users[socket.nickname] = socket;
						updateNicknames();
						console.log("Welcome back " + data);
						socket.emit('login', socket.nickname);
					}
				});
			} else {
				//get the user (if exist)in the database ant not in the array with this password 
				//if the user doesnt exist insert him/her into the database
				database.get(password, function(err, body) {
					console.log("Error:", err);
					console.log("Data:", body);
					if (err) {
						console.log("New user " + data)
						database.insert({
							_id : data,
							password : password
						}, function(error, body) {
							callback(true);
							socket.nickname = data;
							users[socket.nickname] = socket;
							updateNicknames();
							console.log("Welcome " + socket.nickname);
							socket.emit('register', socket.nickname);
						});
					} else {
						callback(true);
						socket.nickname = data;
						users[socket.nickname] = socket;
						updateNicknames();
						console.log("Welcome back " + socket.nickname);
						socket.emit('login', socket.nickname);
					}
				});
			}
		});
	});

	//this function is called to refresh the user array
	function updateNicknames() {
		io.sockets.emit('usernames', Object.keys(users));
	}

	socket.on('send message', function(data, callback) {
		//ignore white space
		var msg = data.trim();
		//substr 0 for /, 1 for p, 3 for empty space
		if (msg.substr(0, 3) === '/p ') {
			msg = msg.substr(3);
			var ind = msg.indexOf(' ');
			//username should be before message text
			if (ind !== -1) {
				var name = msg.substring(0, ind);
				var msg = msg.substring(ind + 1);
				if (name in users) {
					//send private message to the appropriate user
					users[name].emit('private', {
						msg : msg,
						nick : socket.nickname
					});
					console.log('private message is going out by '
							+ socket.nickname);
				} else {
					callback('Enter a valid user');
				}
			} else {
				callback('Enter a message');
			}
		} else {
			//message for everyone
			io.sockets.emit('new message', {
				msg : msg,
				nick : socket.nickname
			});
		
			client1.publish("chatter", data);
		}
	});

	socket.on('disconnect', function(data) {
		if (!socket.nickname)
			return;
		delete users[socket.nickname];
		updateNicknames();
	});
});

	function init() {
	cloudant.db.create('chatserver', function() {
		database = cloudant.db.use('chatserver');
		if (database === undefined) {
			console.log("ERROR: The database is not defined!");
		} else {
			console.log("database connection succesfull");
		}
	});
}
	
	server.listen(port, function(){
		console.log('Server listening on port ' + port);
	});
