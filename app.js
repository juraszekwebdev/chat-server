const app = require('express')();
const http = require('http').createServer(app);
const socketIO = require('socket.io');
const io = new socketIO.Server(http);

app.get('/', (req, res) => {
	res.send('<h1>Hello world</h1>');
});

const PORT = process.env.PORT || 5000;

http.listen(PORT, () => {
	console.log('listening on *:3000');
});

let channels = [];
let members = [];
let initialized = false;
io.on("connection", socket => {
	if (!initialized) {
		socket.on("initChannels", channelsList => {
			channels = channelsList;
			console.log("Channels initialized");
			socket.on("initMembers", membersList => {
				members = membersList;
				initialized = true;
				console.log("Members initialized");
			});
		});
	} else {
		socket.on("userJoin", user => {
			const index = members.findIndex(o => o.uid === user.uid);
			members[index].isActive = true;
			console.log("User joined: " + user.nickName);
			io.emit("updateMembers", members);
		});

		socket.on("userLeave", user => {
			const index = members.findIndex(o => o.uid === user.uid);
			members[index].isActive = false;
			console.log("User left: " + user.nickName);
			io.emit("updateMembers", members);
		});

		socket.on("changeChannel", ({user, channel, messages}) => {
			const index = channels.findIndex(o => o.slug === channel);
			if(index !== -1) {
				channels[index].messages = messages;
			}
			console.log("User: " + user.nickName + " has joined channel: " + channel);
		});

		socket.on("sendMessage", ({message, channel}) => {
			const index = channels.findIndex(o => o.slug === channel);
			channels[index].messages.push(message);
			const messages = channels[index].messages;
			console.log("New message: " + message.message + " on channel: " + channel);
			io.emit("updateMessages", {channel, messages});
		});

		socket.on("disconnect", () => {
			socket.on("userLeave", user => {
				const index = members.findIndex(o => o.uid === user.uid);
				members[index].isActive = false;
				console.log("User left: " + user.nickName);
				io.emit("updateMembers", members);
			});
		});
	}
});