const express = require("express");
const socket = require("socket.io");

// App setup
const PORT = process.env.PORT || 3000;
const app = express();

app.get("/", (req, res) => {
	res.send("Hello world");
})
const INDEX = '/index.html';

const server = express()
	.use((req, res) => res.sendFile(INDEX, { root: __dirname }))
	.listen(PORT, () => console.log(`Listening on ${PORT}`));

// Static files
app.use(express.static("dist"));

// Socket setup
const io = socket(server);

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
