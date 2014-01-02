// [导出]
exports = module.exports = TemplateResponder;

// [模块]
var path = require('path');
var fs = require('fs');
var url = require('url');
var ketchup = require('ketchup-language');
var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;

// [流程]
inherits(TemplateResponder, EventEmitter);

// [函数]
function TemplateResponder() {
	// 输入参数
	this.fileName = undefined;
	this.dataObj = undefined;
	this.req = undefined;
	this.res = undefined;

	// 对外状态
	this.status = undefined;
	this.success = undefined;
	this.errorText = undefined;
}

TemplateResponder.prototype.start = function() {
	var self = this;

	// 因为目前本对象的实现根本就是同步的
	// 因此不会存在重入等问题

	// 清理当前状态
	clean();

	// 进入启动状态
	self.status = 'start';
	self.emit('start');
	
	// 参数检查
	// TODO

	// 加载模板文件并编译
	var content = ketchup.compile(self.fileName, self.dataObj || {});

	// 将编译的结果返回
	self.res.setHeader('Content-Length', Buffer.byteLength(content));
	self.res.setHeader('Content-Type', 'text/html;charset=UTF-8');
	self.res.end(content);

	// 进入停止状态
	self.status = 'stop';
	self.success = true;
	self.emit('stop');

	function clean() {
		// 清理对外状态
		self.status = undefined;
		self.success = undefined;
		self.errorText = undefined;
	}
}

TemplateResponder.prototype.stop = function() {
	// 因为目前的实现是同步的
	// 因此调用本方法时一定是停止的
	// 所以无需做任何操作
	return false;
}