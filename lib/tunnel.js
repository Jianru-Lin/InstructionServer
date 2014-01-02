exports = module.exports = Tunnel;

var net = require('net');
var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var SubTunnel = require('./sub-tunnel');

// [流程]
inherits(Tunnel, EventEmitter);

function Tunnel() {
	// 隧道类型 cipher 或 decipher
	this.type = undefined;

	// 本地监听所用的地址和端口
	this.localHost = undefined;
	this.localPort = undefined;
	
	// 远程地址和端口
	this.remoteHost = undefined;
	this.remotePort = undefined;

	// 传输密钥
	this.key = undefined;

	// 当前状态
	// undefined - 从未开始
	// start - 已经开始
	// stop - 已经结束
	this.status = undefined;

	// 执行结果
	this.success = undefined;
	this.errorText = undefined;

	// 内部变量
	this.server = undefined;
	this.subTunnelList = undefined;
}

Tunnel.prototype.start = function() {
	var self = this;

	// 参数检查
	// TODO

	// 不允许重入
	if (self.status === 'start') {
		return false;
	}

	// 通知订阅者
	self.status = 'start';
	self.emit('start');

	self.subTunnelList = [];

	self.server = net.createServer();
	self.server.on('connection', onConnection);
	self.server.on('error', onError);
	self.server.on('close', onClose);
	self.server.listen(self.localPort, self.localHost);

	function onConnection(clientSocket) {
		var subTunnel = new SubTunnel();
		subTunnel.clientSocket = clientSocket;
		subTunnel.serverHost = self.remoteHost;
		subTunnel.serverPort = self.remotePort;
		subTunnel.type =self.type;
		subTunnel.key = self.key;

		// 注意：这里没有考虑释放的问题
		// 因此会造成内存的泄漏

		subTunnel.start();
	}

	function onError(err) {
		// 停止所有子隧道
		stopAllSubTunnel();

		self.status = 'stop';
		self.success = false;
		self.errorText = err.toString();
		self.emit('stop');
	}

	function onClose() {
		// 停止所有子隧道
		stopAllSubTunnel();

		// 如果 close 事件发生时还没有停止
		// 说明一直没出错
		if (self.status === 'start') {
			self.status = 'stop';
			self.success = true;
			self.errorText = undefined;
			self.emit('stop');
		}
	}

	function stopAllSubTunnel() {
		if (Array.isArray(self.subTunnelList)) {
			self.subTunnelList.forEach(function(subTunnel) {
				subTunnel.stop();
			});
		}
	}
}

Tunnel.prototype.stop = function() {
	var self = this;

	if (self.status === 'start') {
		self.server.close();
	}
}