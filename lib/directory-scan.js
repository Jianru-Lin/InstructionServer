// [导出]
exports = module.exports = DirectoryScan;

// [模块]
var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var fs = require('fs');
var path = require('path');

// [流程]
inherits(DirectoryScan, EventEmitter);

// [函数]
function DirectoryScan() {
	// 输入参数
	this.dir = undefined;

	// 输出结果
	this.fileList = undefined;
	this.warningList = undefined;

	// 对外的状态
	this.status = undefined;
	this.success = undefined;
	this.errorText = undefined;
}

DirectoryScan.prototype.start = function() {
	var self = this;

	// 检查参数
	// TODO

	// 当前的实现是同步的，因此调用 start 方法时
	// 一定是处于 stop 状态的

	// 清理
	self.fileList = undefined;

	// 进入 start 状态
	self.status = 'start';
	self.success = undefined;
	self.errorText = undefined;

	// 通知订阅者
	self.emit('start');

	// 开始扫描
	self.fileList = [];
	self.warningList = [];
	var nextDirList = [self.dir];	// self.dir 应当是绝对路径形式的

	while(nextDirList.length > 0) {
		// 注意 currentDir 在这里必须是绝对路径
		var currentDir = nextDirList.shift();

		try {
			var itemList = fs.readdirSync(currentDir);
		} catch(err) {
			// 记录到警告列表
			self.warningList.push(err.toString());

			// 继续向后执行
			continue;
		}

		itemList.forEach(function(item) {
			var itemPath = path.resolve(currentDir, item);
			try {
				var stat = fs.lstatSync(itemPath);
				if (stat.isDirectory()) {
					// 放入 nextDirList
					nextDirList.push(itemPath);
				} else if (stat.isFile()) {
					// 记录到 fileList
					self.fileList.push({
						name: item,
						relativePath: path.relative(self.dir, itemPath)
					});
				}
			} catch(err) {
				// 记录到警告列表
				self.warningList.push(err.toString());
			}
		});
	}

	// 好的，扫描完成了
	// 进入 stop 状态
	self.status = 'stop';
	self.success = true;
	self.errorText = undefined;

	self.emit('stop');
}

DirectoryScan.prototype.stop = function() {
	// 当前的实现是同步的，因此调用 stop 方法时
	// 一定不可能处于运行状态
	return false;
}