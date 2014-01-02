exports = module.exports = SubTunnel;

var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var crypto = require('crypto');
var net = require('net');

// [流程]
inherits(SubTunnel, EventEmitter);

function SubTunnel() {
	// 服务端的地址和端口
	this.serverHost = undefined;
	this.serverPort = undefined;

	// 客户端套接字以及服务端套接字
	this.clientSocket = undefined;
	this.serverSocket = undefined;

	// 加密/解密流
	this.forwardFilter = undefined;
	this.backwardFilter = undefined;

	// 类型及密钥
	this.type = undefined;
	this.key = undefined;
}

SubTunnel.prototype.start = function() {
	var self = this;

	// 参数检查
	// TODO

	self.serverSocket = net.connect(self.serverPort, self.serverHost);
	self.serverSocket.on('connect', onConnect);
	self.serverSocket.on('error', onError);

	function onConnect() {
		// 建立前后向过滤器
		var forwardFilter = undefined;
		var backwardFilter = undefined;
		var key = self.key;

		if (self.type === 'cipher') {
			forwardFilter = crypto.createCipher('rc4', key);
			backwardFilter = crypto.createDecipher('rc4', key);
		} else if (self.type === 'decipher') {
			forwardFilter = crypto.createDecipher('rc4', key);
			backwardFilter = crypto.createCipher('rc4', key);
		}

		forwardFilter.on('error', onForwardFilterError);
		backwardFilter.on('error', onBackwardFilterError);

		self.forwardFilter = forwardFilter;
		self.backwardFilter = backwardFilter;

		// 开始转发
		self.clientSocket.pipe(forwardFilter);
		forwardFilter.pipe(self.serverSocket);

		self.serverSocket.pipe(backwardFilter);
		backwardFilter.pipe(self.clientSocket);

		function onForwardFilterError(err) {
			console.log(err.toString());
		}

		function onBackwardFilterError(err) {
			console.log(err.toString());
		}
	}

	function onError(err) {
		console.log(err.toString());
	}
}

SubTunnel.prototype.stop = function() {
	// TODO
}