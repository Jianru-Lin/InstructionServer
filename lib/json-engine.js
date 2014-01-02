// [导出]
exports = module.exports = JsonEngine;

// [模块]
var Engine = require('./engine');
var JsonServer = require('./json-server');
var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;

// [流程]
inherits(JsonEngine, EventEmitter);

// [函数]
function JsonEngine() {
	// 输入参数
	this.host = undefined;
	this.port = undefined;
	this.context = undefined;
	this.moduleDir = undefined;

	// 对外状态
	this.status = undefined;
	this.success = undefined;
	this.errorText = undefined;

	// 内部状态
	this.isStopping = undefined;

	// 内部变量
	this.engine = undefined;
	this.jsonServer = undefined;
}

JsonEngine.prototype.start = function() {
	var self = this;

	// 检查参数
	// TODO

	if (self.status === 'start') {
		return false;
	}

	clean();

	// 进入启动状态并通知订阅者
	self.status = 'start';
	self.emit('start');

	// 创建指令引擎，此时什么指令也没有
	self.engine = new Engine();
	self.engine.context = self.context;
	self.engine.instructionHandler = {};
	self.engine.moduleDir = self.moduleDir;

	// 创建 JSON 服务程序
	self.jsonServer = new JsonServer();
	self.jsonServer.host = self.host;
	self.jsonServer.port = self.port;

	// 监听基本事件
	self.jsonServer.on('request', onJsonServerRequest);
	self.jsonServer.on('listening', onJsonServerListening);
	self.jsonServer.on('stop', onJsonServerStop);

	// 启动
	self.jsonServer.start();

	function onJsonServerListening() {
		self.emit('listening');
	}

	function onJsonServerRequest(reqObj, resCallback) {
		var instructions = reqObj;

		// 加入指令队列执行
		self.engine.append(instructions, resCallback);
	}

	function onJsonServerStop() {
		// Json Server 停止意味着本对象也停止
		self.status = 'stop';

		if (self.jsonServer.success) {
			self.success = true;
			self.errorText = undefined;
		} else {
			self.success = false;
			self.errorText = 'jsonServer error';
		}

		self.isStopping = undefined;

		// 通知订阅者
		self.emit('stop');
	}

	function clean() {
		// 清理对外状态
		self.status = undefined;
		self.success = undefined;
		self.errorText = undefined;

		// 清理内部状态
		self.isStopping = undefined;

		// 清理内部变量
		self.engine = undefined;
		self.jsonServer = undefined;
	}
}

JsonEngine.prototype.stop = function() {
	var self = this;

	//  如果没有启动，就不做任何操作
	if (self.status !== 'start') {
		return false;
	}

	// 防止重入
	if (self.isStopping) {
		return false;
	}

	self.isStopping = true;

	// engine 无需停止，只需停止 jsonServer
	self.jsonServer.stop();
}