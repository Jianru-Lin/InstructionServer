// [导出]
exports = module.exports = WebEngine;

// [模块]
var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var Engine = require('./engine');
var express = require('express');
var PageManager = require('./page-manager');

// [流程]
inherits(WebEngine, EventEmitter);


// [函数]
function WebEngine() {
	// 外部参数
	this.host = undefined;
	this.port = undefined;
	this.pageDir = undefined;
	this.contentDir = undefined;
	this.context = undefined;
	this.moduleDir = undefined;

	// 内部变量
	this.expressApp = undefined;
	this.engine = undefined;
	this.pageManager = undefined;

	// 对外的状态
	this.status = undefined;
	this.success = undefined;
	this.errorText = undefined;

	// 内部变量
	this.isStopping = undefined;
}

WebEngine.prototype.start = function() {
	var self = this;

	// 检查参数
	// TODO

	// 避免重入
	if (self.status === 'start') {
		return false;
	}

	// 清理一下运行环境
	clean();

	// 发出 start 事件通知订阅者
	self.status = 'start';
	self.emit('start');

	// 初始化 engine
	initEngine();

	// 初始化 expressApp
	initExpressApp();

	return true;

	function clean() {
		// 清理内部变量
		self.expressApp = undefined;
		self.engine = undefined;
		self.pageManager = undefined;

		// 清理对外的状态
		self.status = undefined;
		self.success = undefined;
		self.errorText = undefined;

		// 清理内部变量
		self.isStopping = undefined;
	}

	function initEngine() {
		self.engine = new Engine();
		self.engine.context = self.context;
		self.engine.instructionHandler = {};
		self.engine.moduleDir = self.moduleDir;
	}

	function initExpressApp() {
		// 创建 express 服务器
		self.expressApp = express();
		self.expressApp.use(express.static(self.contentDir));
		self.expressApp.use(express.json());

		// 创建 PageManager
		self.pageManager = new PageManager();
		self.pageManager.hoster = self.expressApp;
		self.pageManager.pageDir = self.pageDir;

		// 启动 PageManager
		// 这里已知 PageManager 的加载过程是同步的
		// 因此没有去订阅 start 或者 stop 事件
		self.pageManager.start();

		// 页面管理器必须加载成功，否则不会启动
		if (!self.pageManager.success) {
			self.status = 'stop';
			self.success = false;
			self.errorText = 'start PageManager failed';

			self.emit('stop');

			// 不再继续向下执行
			return true;
		}

		// ！这里会处理 POST 到 /instruction 处的所有请求
		// 这里很关键
		self.expressApp.post('/instruction', onPostInstruction);
		self.expressApp.post('/delay', function() {
			console.log('delay');
		});

		// 启动 express 服务器
		// 注意这里把 listen() 的返回值记录了下来
		// 它是一个普通的 nodejs http server
		// 待会儿关闭的时候要用到
		var __server__ = self.expressApp.listen(self.port, self.host);
		self.expressApp.__server__ = __server__;

		// 监听几个事件
		__server__.on('listening', onExpressAppListening);
		__server__.on('error', onExpressAppError);


		// [函数]
		function onExpressAppListening() {
			// 发出 listening 事件通知订阅者
			self.emit('listening');
		}

		function onExpressAppError(err) {
			// 进入停止状态并通知订阅者
			self.status = 'stop';
			self.success = false;
			self.errorText = err.toString();
			self.isStopping = undefined;

			self.emit('stop');
		}

		function onPostInstruction(req, res) {
			var jsonReqObj = req.body;
			if (!jsonReqObj) {
				res.statusCode = 400;
				res.end();
				return;
			}

			var instructions = jsonReqObj;

			// 加入指令队列执行
			self.engine.append(instructions, resCallback);

			function resCallback(resObj) {
				// 转换为 JSON 文本

				var text = JSON.stringify(resObj);
				var length = Buffer.byteLength(text, 'utf8');

				// 发送响应

				res.statusCode = 200;
				res.setHeader('Content-Type', 'application/json;charset=UTF-8');
				res.setHeader('Content-Length', length);

				res.end(text);
			}
		}
	}
}

WebEngine.prototype.stop = function() {
	var self = this;

	// 如果没有开始则不执行任何操作
	if (self.status !== 'start') {
		return false;
	}

	// 防止重入
	if (self.isStopping) {
		return false;
	}

	// 标记为停止中
	self.isStopping = true;

	// 这里只需要关闭 expressApp 即可
	// pageManager 和 engine 都不用管
	self.expressApp.__server__.close(function() {
		self.status = 'stop';
		self.success = true;
		self.errorText = undefined;
		self.isStopping = undefined;

		self.emit('stop');
	});
}