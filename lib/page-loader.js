// [导出]
exports = module.exports = PageLoader;

// [模块]
var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;

// [流程]
inherits(PageLoader, EventEmitter);

// [函数]
function PageLoader() {
	// 输入参数
	this.pageFileName = undefined;
	this.hoster = undefined;
	
	// 输出
	this.pageObj = undefined;

	// 对外状态
	this.status = undefined;
	this.success = undefined;
	this.errorText = undefined;
}

PageLoader.prototype.start = function() {
	var self = this;

	// 参数检查
	// TODO

	// 注意：目前这个过程的实现是同步的
	// 因此无法停止，也不可能重入

	// 清理一下执行环境
	clean();

	// 开始启动
	// 通知订阅者
	self.status = 'start';
	self.success = undefined;
	self.errorText = undefined;
	self.emit('start');

	try {
		self.pageObj = require(self.pageFileName);
	} catch(err) {
		// 如果页面加载不成功
		// 后面也无法进行了，这是一个严重的错误
		// 通知订阅者
		self.status = 'stop';
		self.success = false;
		self.errorText = err.toString();
		self.emit('stop');

		// 不再继续向下执行
		return;
	}

	// 检查 pageObj 的格式
	// TODO

	for (var method in self.pageObj.def) {
		var urlList = self.pageObj.def[method];
		if (!Array.isArray(urlList)) continue;

		urlList.forEach(function(url) {
			try {
				self.hoster[method](url, self.pageObj.respond);
			} catch(err) {
				// 对于无效的 method 忽略即可
			}
		});
	}

	// 成功完成了
	// 通知订阅者
	self.status = 'stop';
	self.success = true;
	self.errorText = undefined;
	self.emit('stop');

	return true;

	function clean() {
		// pageFileName, hoster 是输入参数
		// 因此不用清理

		// 清理输出
		self.pageObj = undefined;

		// 清理对外状态
		self.status = undefined;
		self.success = undefined;
		self.errorText = undefined;
	}
}

PageLoader.prototype.stop = function() {
	// 当调用本方法的时候必然已经停止了
	// 因此无效，不会触发任何事件
	return false;
}