'use strict';

const debug = require('debug')('nesjs:client');

const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);

const PORT = 8002;

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

server.listen(PORT);

io.on('connection', (socket) => {
  socket.emit('news', { hello: 'world' });

/*  socket.on('my other event', function (data) {
    console.log(data);
  });*/
});

let lastSentRamBuffer;
const rawData = Buffer.allocUnsafe(2048);
module.exports.sendMemData = function(_rawData) {
  _rawData.copy(rawData, 0, 0, 2048);
  if (!lastSentRamBuffer) {
    lastSentRamBuffer = Buffer.from(rawData);
    lastSentRamBuffer[0]=0x3e;
  }
  const duplicateData = rawData.equals(lastSentRamBuffer);
  if (duplicateData) {
    return;
  }
  debug('send memory data');
  rawData.copy(lastSentRamBuffer);
  io.sockets.emit('dbg:mem', { rawData });
};
