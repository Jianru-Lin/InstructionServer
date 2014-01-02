// [导出]
exports = module.exports = PageManager;

// [模块]
var PageLoader = require('./page-loader');
var fs = require('fs');
var path = require('path');
var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;

// [流程]
inherits(PageManager, EventEmitter);

// [函数]
function PageManager() {
	// 输入参数
	this.pageDir = undefined;
	this.hoster = undefined;	// express 的一个实例

	// 对外状态
	this.status = undefined;
	this.success = undefined;
	this.errorText = undefined;

	// 内部变量
	this.pageLoaderList = undefined;
}

PageManager.prototype.start = function() {
	var self = this;

	// 检查参数
	// TODO

	// 注意：目前这个过程的实现是同步的
	// 因此无法停止，也不可能重入

	// 清理一下运行环境
	clean();

	// 进入启动状态
	// 通知订阅者
	self.status = 'start';
	self.success = undefined;
	self.errorText = undefined;
	self.emit('start');

	var pageDir;
	var fileList;
	var pageList;

	// 读取文件列表
	pageDir = self.pageDir;
	try {
		fileList = fs.readdirSync(pageDir);
	} catch(err) {
		// 出错了，进入停止状态
		self.status = 'stop';
		self.success = false;
		self.errorText = err.toString();
		self.emit('stop');

		// 不再继续向下执行
		return;
	}

	// 将文件名补足为完整路径
	// 注意这里还限制了只会考虑 .js 结尾的文件
	pageFileNameList = [];
	fileList.forEach(function(file) {
		// 只加载以 .js 结尾的文件
		if (!/.js$/.test(file)) return;
		pageFileNameList.push(path.resolve(pageDir, file));
	});

	// 加载每一个页面
	self.pageLoaderList = [];

	pageFileNameList.forEach(function(pageFileName) {
		// 创建一个新的页面加载器并加入到列表中，然后开始加载
		var pageLoader = new PageLoader();
		pageLoader.hoster = self.hoster;
		pageLoader.pageFileName = pageFileName;

		self.pageLoaderList.push(pageLoader);

		pageLoader.start();

		// 因为这里已知  PageLoader 是同步的
		// 因此就不走订阅 stop 事件的方式了（虽然也是可以的）

		// 另外，PageLoader 加载失败并不会影响当前的 PageManager 因为分工不同
	});

	// 至此已经成功完成
	// 通知订阅者
	self.status = 'stop';
	self.success = true;
	self.errorText = undefined;
	self.emit('stop');

	return true;

	function clean() {
		// pageDir 和 hoster 是输入参数
		// 因此不用清理

		// 清理对外状态
		self.status = undefined;
		self.success = undefined;
		self.errorText = undefined;

		// 清理内部变量
		self.pageLoaderList = undefined;
	}
}