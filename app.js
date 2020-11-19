// const express = require('express');
// const socketIO = require('socket.io');
//
// const PORT = process.env.PORT || 3000;
// const INDEX = '/index.html';
//
// const server = express()
// 	.use((req, res) => res.sendFile(INDEX, { root: __dirname }))
// 	.listen(PORT, () => console.log(`Listening on ${PORT}`));
//
// const io = socketIO(server);

const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
	cors: {
		origin: "http://localhost:8080",
		methods: ["GET", "POST"],
		allowedHeaders: ["*"],
		credentials: true
	}
});


app.get('/', (req, res) => {
	res.sendFile(__dirname + '/index.html')
});

server.listen(process.env.PORT || 3000, () => {
	console.log('Listening on port *: 3000');
});

let channels = [];
let members = [];
io.on("connection", (socket) => {
	socket.on('joined', ({user, channel}) => {
		const index = members.findIndex(o => o.uid === user.uid);
		if(index !== -1) {
			members[index].isActive = true;
		} else {
			members.push({
				...user,
				isActive: true,
				channel
			})
		}
		io.emit('updateMembers', members);
		console.log('Joined ' + user.nickname);
	});

	socket.on('leave', (user) => {
		const index = members.findIndex(o => o.uid === user.uid);
		if(index !== -1) {
			members[index].isActive = false;
		}
		io.emit('updateMembers', members);
		console.log('Left ' + user.nickname);
	});

	socket.on("changeChannel", ({user, channel, messages}) => {
		const index = channels.findIndex(o => o.slug === channel);
		if(index !== -1) {
			channels[index].messages = messages;
		} else {
			channels.push({
				slug: channel,
				messages,
			})
		}

		console.log("User: " + user.nickname + " has joined channel: " + channel);
	});

	socket.on("sendMessage", ({message, channel}) => {
		const index = channels.findIndex(o => o.slug === channel);
		channels[index].messages.push(message);
		const messages = channels[index].messages;
		console.log("New message: " + message.message + " on channel: " + channel);
		io.emit("updateMessages", {channel, messages});
	});
});