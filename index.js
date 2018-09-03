var net = require('net');
var dgram = require('dgram');

var videoReceiver = dgram.createSocket('udp4');
var videoSender = dgram.createSocket('udp4');

var client = net.Socket();

var elapsed = 0;
var sequenceNumber = 0;

var ALIVE_REPLY = Buffer.from([0xab, 0xcd, 0x00, 0x00, 0x00, 0x00, 0x01, 0x13]);

videoReceiver.bind(6669);

var rtpPacket = Buffer.alloc(12);

videoReceiver.on('listening', function() {
    console.log("Waiting for Video Stream on Port 6669");
});

videoReceiver.on('message', function(msg, rinfo) {
    var channel = msg.readUInt16BE(6);

    if(channel == 1) {
        var payload = msg.slice(8);
        videoSender.send(payload, 8888, "127.0.0.1");
        //frameBuffer = Buffer.concat([frameBuffer, payload]);
    } else if(channel == 2) {

        rtpPacket.writeUInt16BE(0x8063, 0);
        rtpPacket.writeUInt16BE(sequenceNumber, 2);
        rtpPacket.writeUInt32BE(elapsed * 90, 4);
        rtpPacket.writeUInt32BE(0, 8);

        videoSender.send(rtpPacket, 8888, "127.0.0.1");

        elapsed = msg.readUInt32LE(20);

        sequenceNumber++;
    }

});

client.connect(6666, '192.168.100.1', function() {
    console.log("Connected to Action-Cam");
    login(client, "admin", "12345");
});

client.on('data', function(data) {
    var command = data.readUInt16BE(6);

    switch(command) {
        case 0x0112: //Alive Request
            client.write(ALIVE_REPLY);
            break;
        case 0x0111: //Login Accept
            sendCommand(client, 0xA034); //Request Firmware info
            break;
        case 0xA035:
            sendCommand(client, 0x01FF, Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
            break;
    }
});

function createPacket(command) {
    var packet = Buffer.from([0xab, 0xcd, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    packet.writeUInt16BE(command, 6);
    return packet;
}

function login(c, username, password) {
    var p = createPacket(0x0110);
    var loginData = Buffer.alloc(128);
    loginData.write(username, 0, username.length, "ascii");
    loginData.write(password, 64, password.length, "ascii");

    p = Buffer.concat([p, loginData]);
    p.writeUInt16BE(p.length - 8, 2);
    sendToClient(c, p);
}

function sendCommand(c, command, payload) {
    var p = createPacket(command);
    if(payload != null) {
        p = Buffer.concat([p, payload]);
    }
    p.writeUInt16BE(p.length - 8, 2);
    sendToClient(c, p);
}

function sendToClient(c, buffer) {
    c.write(buffer);
}

client.on('close', function() {
    console.log("Lost connection to Action-Cam");
});