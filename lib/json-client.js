// [导出]
exports = module.exports = JsonClient;

// [模块]
var http = require('http');
var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var url = require('url');

// [流程]
inherits(JsonClient, EventEmitter);

// [函数]
function JsonClient() {
	// 当前状态
	// undefined - 从未开始
	// start - 已经开始
	// stop - 已经结束
	this.status = undefined;

	// 服务器 URL
	this.hostUrl = undefined;

	// 代理设置
	// 包括是否使用代理，代理主机名，代理端口
	this.useProxy = undefined;
	this.proxyHost = undefined;
	this.proxyPort = undefined;

	// 请求对象和响应对象
	this.requestObj = undefined;
	this.responseObj = undefined;

	// 结果
	this.success = undefined;
	this.errorText = undefined;

	// 内部变量
	this._req = undefined;
	this._res = undefined;
}

JsonClient.prototype.start = function() {
	var self = this;

	// 参数检查
	// TODO

	// 改变当前状态，并发出事件
	self.status = 'start';
	self.emit('start');

	var bodyText = JSON.stringify(self.requestObj);
	var length = Buffer.byteLength(bodyText);

	self._req = createRequest();
	self._req.method = 'POST';
	self._req.setHeader('Content-Type', 'application/json;charset=UTF-8');
	self._req.setHeader('Content-Length', length);
	self._req.on('error', onError);
	self._req.on('response', onResponse);

	// 发送
	self._req.end(bodyText);

	function createRequest() {
		if (!self.useProxy) {
			return http.request(self.hostUrl)
		} else {
			var hostUrlParsed = url.parse(self.hostUrl);

			var options = {
				host: self.proxyHost,
				port: self.proxyPort,
				path: hostUrlParsed.path,
				headers: {
					Host: hostUrlParsed.host
				}
			};

			return http.request(options);
		}
	}

	function onError(err) {
		failureStopWith(err.toString());
	}

	function onResponse(res) {
		self._res = res;

		if (res.statusCode !== 200) {
			failureStopWith( 'statusCode: ' + res.statusCode);
			return;
		}

		if (!/^application\/json;\s*charset=UTF-8/i.test(res.headers['content-type'])) {
			failureStopWith('Content-Type: ' + res.headers['content-type']);
			return;
		}

		var chunks = [];
		var totalLength = 0;

		res.on('data', onData);
		res.on('end', onEnd);
		res.on('error', onError);

		function onData(chunk) {
			chunks.push(chunk);
		}

		function onEnd() {
			var buffer = Buffer.concat(chunks, totalLength);
			var text = buffer.toString('utf8');
			var obj = JSON.parse(text);

			// 好了，通知订阅者
			successStopWith(obj);
		}

		function onError(err) {
			failureStopWith(err.toString());
		}
	}

	function successStopWith(responseObj) {
		self.responseObj = responseObj;
		self.status = 'stop';
		self.success = true;
		self.errorText = undefined;
		self.emit('stop');
	}

	function failureStopWith(errorText) {
		self.status = 'stop';
		self.success = false;
		self.errorText = errorText;
		self.emit('stop');
	}
}