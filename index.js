var express = require('express'), 
app = express(), 
server = require('http').createServer(app), 
io = require('socket.io').listen(server), 
Cloudant = require('cloudant'),


username = "73bb44a7-c8d7-475f-9d79-d9c018c81f6c-bluemix",
password = "34e4b92c18c2664dc54c6a8c7e9be8c1b978ad7a4ae8a44a5c6de0b615566cfd",
cloudant = Cloudant({account:username,password:password});

users = {};

//use port 8080 unless there exists a preconfigured port
var port = process.env.port || 8080;

server.listen(port);

//get to https 
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

var cloudant;
var database;

io.sockets.on('connection', function(socket) {

	socket.on('new user', function(data, callback) {

		socket.on('setPassword', function(password) {
			
			
			
			database.insert({_id : data,password : password}, function(error, body) {
			
			});
		
		
		if (data in users) {
			callback(false);
		} else {
			callback(true);
			socket.nickname = data;
			users[socket.nickname] = socket;
			updateNicknames();
		}
	});
	});
	
	
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
					console.log('private message is going out by ' + socket.nickname);
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

	cloudant.db.create('chatserver', function ()
	{
		database = cloudant.db.use('chatserver');
	
		if (database === undefined) {
	
			console.log("ERROR: The database is not defined!");
	
		} else {
			console.log("database connection succesfull");
		}
	});
}
