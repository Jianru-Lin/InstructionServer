// [导出]
exports = module.exports = JsonServer;

// [模块]
var http = require('http');
var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var Listener = require('./listener');

// [流程]
inherits(JsonServer, EventEmitter);

// [函数]
function JsonServer() {
	/* 外部状态 */

	// 监听的地址和端口
	this.host = undefined;
	this.port = undefined;
	
	// 当前状态
	// undefined 从未启动
	// start 已启动
	// stop 已停止
	this.status = undefined;

	// 当 stop 事件发生的时候，会通过这两个
	// 变量弄清楚是否发生了错误
	this.success = undefined;
	this.errorText = undefined;

	/* 内部状态 */

	this.server = undefined;
	this.serverListener = undefined;
	this.serverError = undefined;
	this.requestCount = {
		total: 0,
		success: 0,
		failure: 0
	};

	// 用于防止 stop 命令重入
	this.isStopping = undefined;
}

JsonServer.prototype.start = function() {
	var self = this;

	// 禁止重入
	if (self.status === 'start') {
		return false;
	}

	// 清理运行环境
	clean();

	// 转入 start 状态并通知订阅者
	self.status = 'start';
	self.emit('start');

	// 创建 http server
	self.server = http.createServer();

	// 创建 serverListener 用于代理事件订阅
	self.serverListener = new Listener();
	self.serverListener.eventSource = self.server;
	self.serverListener.enable = true;
	
	self.serverListener.on('listening', onListening);
	self.serverListener.on('request', onRequest);
	self.serverListener.on('error', onError);

	// 启动 http server
	self.server.listen(self.port, self.host);

	return true;

	// [函数]

	function clean() {
		// host 和 port 是用户输入的变量，因此不清理

		// 清理 status
		self.status = undefined;

		// 清理 success 和 errorText
		self.success = undefined;
		self.errorText = undefined;

		// 清理 server 和 serverError
		self.server = undefined;
		self.serverError = undefined;

		// 清理 serverListener
		self.serverListener = undefined;


		// 清理 requestCount
		self.requestCount.total = 0;
		self.requestCount.success = 0;
		self.requestCount.failure = 0;

		// 清理 isStopping
		self.isStopping = undefined;
	}

	function onListening() {
		// 进入监听状态了，服务程序创建已经成功
		// 发出 listening 事件通知订阅者
		self.emit('listening');
	}

	function onRequest(req, res) {
		++self.requestCount.total;

		// 必须是 POST

		if (req.method !== 'POST') {
			++self.requestCount.failure;
			res.status = 404;
			res.end();
			return;
		}

		// Content-Type 必须为 JSON 类型

		var contentType = req.headers['content-type'];
		if (!/^application\/json;\s*charset=UTF-8$/i.test(contentType)) {
			++self.requestCount.failure;
			res.status = 404;
			res.end();
			return;
		}

		// 开始接收数据

		receiveBody(function(buffer) {
			try {
				// 转换为字符串
				var text = buffer.toString('utf8');

				// 以 JSON 格式解析
				var jsonObj = JSON.parse(text);

				// 发出事件通知订阅者
				self.emit('request', jsonObj, resCallback);

			} catch(err) {
				++self.requestCount.failure;
				// 断开与客户端的连接
				// 提示 400 错误

				var body = err.toString();
				var length = Buffer.byteLength(body);

				res.statusCode = 400;
				res.setHeader('Content-Type', 'text/plain;charset=UTF-8');
				res.setHeader('Content-Length', length);
				res.end(body);
			}
		});

		// # successCallback(buffer)

		function receiveBody(successCallback) {
			var chunks = [];
			var totalLength = 0;

			req.on('data', function(chunk) {
				chunks.push(chunk);
				totalLength += chunk.length;
			});

			req.on('end', function(chunk) {
				var buffer = Buffer.concat(chunks, totalLength);
				successCallback(buffer);
			});

			req.on('error', function(err) {
				++self.requestCount.failure;
			});
		}

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

	function onError(err) {
		// 已经完全停止
		self.status = 'stop';

		// 记录下错误
		self.serverError = err;
		self.errorText = err.toString();

		// 执行结果标记为失败
		self.success = false;

		// 通知订阅者
		self.emit('stop');
	}
}

JsonServer.prototype.stop = function() {
	var self = this;

	// 已经停止了，就不用再做任何操作
	if (self.status === 'stop') {
		return false;
	}

	// 尚未停止，但是正在停止中
	if (self.isStopping) {
		return false;
	}

	// 标记为停止中
	self.isStopping = true;
	
	// 关闭 serverListener 禁止事件继续传播
	self.serverListener.enable = false;

	// 把 server 关闭并释放
	// 注意由于我们已经关闭了 serverListener
	// 因此在这个对象的其他部分是绝不会接收到 'close' 事件通知的
	self.server.close(function() {
		// 取消停止中标记
		self.isStopping = false;

		// 进入停止状态
		self.status = 'stop';

		// 因为是正常停止的，因此没有错误
		self.success = true;
		self.errorText = undefined;

		// 上面的步骤都执行完了才发出 stop 事件
		self.emit('stop');
	});
}