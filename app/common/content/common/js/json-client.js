function JsonClient() {
	// 输入参数
	this.url = undefined;
	this.requestObj = undefined;

	// 输出参数
	this.responseObj = undefined;

	// 对外状态
	this.status = undefined;
	this.success = undefined;
	this.errorText = undefined;

	// 内部变量
	this.xhr = undefined;

	// 用于事件订阅和通知的内部变量
	// listeners: {event:handlerList, ...}
	// handlerList: [handler, ...]
	this.listeners = undefined;
}

// 如果你需要重复在同一个对象上 start
// 那么需要小心避免重复订阅 listener
JsonClient.prototype.start = function() {
	var self = this;

	// 参数检查
	// TODO

	// 防止重入
	if (self.status === 'start') {
		return false;
	}

	clean();

	// 进入启动状态并通知订阅者
	self.status = 'start';
	self.emit('start');

	// 创建新的 XMLHttpRequest 对象
	self.xhr = new XMLHttpRequest();
	self.xhr.open('POST', self.url);
	self.xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
	self.xhr.onreadystatechange = onReadyStateChange;

	// 发送请求
	var text = JSON.stringify(self.requestObj);
	self.xhr.send(text);

	function clean() {
		// 注意输入参数和用于事件监听的变量不会清理

		// 清理输出参数
		self.responseObj = undefined;

		// 清理对外状态
		self.status = undefined;
		self.success = undefined;
		self.errorText = undefined;

		// 清理内部变量
		self.xhr = undefined;
	}

	function onReadyStateChange() {
		if (self.xhr.readyState !== 4) return;

		if (self.xhr.status !== 200) {
			// 请求失败
			self.status = 'stop';
			self.success = false;
			self.errorText = 'response status: ' + self.xhr.status;
			self.emit('stop');
		} else {
			// 解析返回的 JSON 数据
			var responseText = self.xhr.responseText;
			if (!responseText) {
				// 响应的文本为空
				self.status = 'stop';
				self.success = false;
				self.errorText = 'response text is empty';
				self.emit('stop');

				return;
			}

			// 解析为 JSON 对象
			var obj = undefined;
			try {
				obj = JSON.parse(responseText);
			} catch(err) {
				// 解析失败
				self.status = 'stop';
				self.success = false;
				self.errorText = 'parse response text error';
				self.emit('stop');
				return;
			}

			// 成功了
			self.responseObj = obj;
			self.status = 'stop';
			self.success = true;
			self.errorText = undefined;
			self.emit('stop');
		}
	}
}

JsonClient.prototype.stop = function() {
	var self = this;

	// 如果没有运行，就什么也不做
	if (self.status !== 'start') {
		return false;
	}

	// 调用 abort 后，会触发 xhr 的 onreadystatechange
	// 里面会发出 stop 事件
	self.xhr.abort();
}

JsonClient.prototype.emit = function(event) {
	var self = this;

	if (!self.listeners) return;
	var handlerList = self.listeners[event];
	if (!handlerList) return;
	for (var i = 0, len = handlerList.length; i < len; ++i) {
		try {
			// 调用每一个 handler
			handlerList[i]();
		} catch(err) {
			// 忽略错误
		}
	}
}

JsonClient.prototype.on = JsonClient.prototype.addListener = function(event, handler) {
	var self = this;

	if (!self.listeners) {
		self.listeners = {};
	}

	if (!self.listeners[event]) {
		self.listeners[event] = [handler];
	} else {
		self.listeners[event].push(handler);
	}
}

JsonClient.prototype.removeListener = function(event, handler) {
	var self = this;

	if (!self.listeners) return;

	var handlerList = self.listeners[event];
	if (!handlerList) return;

	// 这里需要删除目标 handler
	// 方法为创建一个新的数组，把旧的拷贝过去
	// 拷贝的过程中忽略目标 handler
	var newHandlerList = [];

	while (handlerList.length > 0) {
		var h = handlerList.shift();
		if (h !== handler) {
			newHandlerList.push(h);
		}
	}

	self.listeners[event] = newHandlerList;
}