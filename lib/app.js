// [导出]
exports = module.exports = App;

// [模块]
var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var fs = require('fs');
var path = require('path');
var DirectoryScan = require('./directory-scan');

// [流程]
inherits(App, EventEmitter);

// [函数]
function App() {
	// 输入参数
	this.dir = undefined;

	// 输出参数
	this.contentDir = undefined;
	this.pageDir = undefined;
	this.instructionDir = undefined;

	this.pageList = undefined;
	this.contentList = undefined;
	this.instructionList = undefined;
	
	this.warningList = undefined;

	// 对外的状态
	this.status = undefined;
	this.success = undefined;
	this.errorText = undefined;
}

App.prototype.start = function() {
	var self = this;

	// 检查参数
	// TODO

	// 当前的实现是同步的，因此调用 start 方法时
	// 一定是处于 stop 状态的

	self.status = 'start';
	self.success = undefined;
	self.errorText = undefined;

	self.contentDir = undefined;
	self.pageDir = undefined;
	self.instructionDir = undefined;

	self.pageList = undefined;
	self.contentList = undefined;
	self.instructionList = undefined;

	self.warningList = undefined;

	self.emit('start');

	// 计算出各个目录
	self.contentDir = path.resolve(self.dir, 'content');
	self.pageDir = path.resolve(self.dir, 'page');
	self.instructionDir = path.resolve(self.dir, 'instruction');

	// 首先是 contentList
	initContentList();

	// 接下来是 pageList
	initPageList();

	// 最后是 instructionList
	initInstructionList();

	// 至此已经完成了全部工作
	self.status = 'stop';
	self.success = true;
	self.errorText = undefined;

	self.emit('stop');

	function initContentList() {
		// 利用 DirectoryScan 来完成 contentList 的构建
		// 注意这里已知 DirectoryScan 是同步的并且不会出错（即使参数不正确）
		var directoryScan = new DirectoryScan();
		directoryScan.dir = self.contentDir;
		directoryScan.start();

		self.contentList = directoryScan.fileList;
		self.warningList = directoryScan.warningList;

		// 这里需要做一个特殊的处理，需要把 contentList 中的 \ 全部替换为 /
		if (Array.isArray(self.contentList)) {
			if (path.sep === '\\') {
				self.contentList.forEach(function(content) {
					content.relativePath = '/' + content.relativePath.replace(/\\/g, '/');
				});
			} else {
				self.contentList.forEach(function(content) {
					content.relativePath = '/' + content.relativePath;
				});
			}
		}
	}

	function initPageList() {
		// 读取文件列表
		self.pageList = [];
		var pageDir = self.pageDir;
		try {
			var shortFileNameList = fs.readdirSync(pageDir);
		} catch(err) {
			// 输出一条警告信息，但是不会出错
			self.warningList.push('[initPageList] ' + err.toString());

			// 不再继续向下执行
			return;
		}

		// 容错
		shortFileNameList = shortFileNameList || [];

		// 将文件名补足为完整路径
		// 注意这里只会考虑 .js 结尾的文件
		var fullFileNameList = [];
		shortFileNameList.forEach(function(shortFileName) {
			// 只加载以 .js 结尾的文件
			if (!/.js$/.test(shortFileName)) return;
			fullFileNameList.push(path.resolve(pageDir, shortFileName));
		});

		// 加载每一个页面
		fullFileNameList.forEach(function(fullFileName) {
			try {
				var page = require(fullFileName);
				self.pageList.push({
					name: path.relative(pageDir, fullFileName),
					def: page.def,
					respond: page.respond
				});
			} catch(err) {
				// 容忍错误，加入警告
				self.warningList.push('[initPageList] ' + err.toString());
			}
		});
	}

	function initInstructionList() {
		self.instructionList = [];
		var instructionDir = self.instructionDir;
		try {
			var shortFileNameList = fs.readdirSync(instructionDir);
		} catch(err) {
			// 输出一条警告信息，但是不会出错
			self.warningList.push('[initInstructionList] ' + err.toString());
			
			// 不再继续向下执行
		}

		// 容错
		shortFileNameList = shortFileNameList || [];

		// 将文件名补足为完整路径
		// 注意这里只会考虑 .js 结尾的文件
		var fullFileNameList = [];
		shortFileNameList.forEach(function(file) {
			if (!/.js$/.test(file)) return;
			fullFileNameList.push(path.resolve(instructionDir, file));
		});

		// 加载每一个指令
		fullFileNameList.forEach(function(fullFileName) {
			try {
				self.instructionList.push(require(fullFileName));
			} catch(err) {
				// 容忍错误，加入警告
				self.warningList.push('[initInstructionList] ' + err.toString());
			}
		});
	}
}

App.prototype.stop = function() {
	// 当前的实现是同步的，因此调用 stop 方法时
	// 一定不可能处于运行状态
	return false;
}

// // 测试
// var a = new App();
// a.dir = 'F:/Users/Jianru/Desktop/项目相关/Hades/server/app/common';

// a.start();

// debugger;