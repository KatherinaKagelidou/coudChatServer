var express = require('express'), 
app = express(), 
server = require('http').createServer(app), 
io = require('socket.io').listen(server), 
users = {};

server.listen(8080);

app.use('/', express.static(__dirname));

app.get('/', function(req, res) {
	res.sendfile('index.html');
});

io.sockets.on('connection', function(socket) {

	socket.on('new user', function(data, callback) {
		if (data in users) {
			callback(false);
		} else {
			callback(true);
			socket.nickname = data;
			users[socket.nickname] = socket;
			updateNicknames();
		}
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