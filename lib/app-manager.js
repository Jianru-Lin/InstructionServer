// [导出]
exports = module.exports = AppManager;

// [模块]
var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;

// [流程]
inherits(AppManager, EventEmitter);

function AppManager() {
	// 外部参数
	this.appDir = undefined;
	this.expressApp = undefined;

	// 内部变量
	this.engine = 
}

AppManager.prototype.start = function() {

}

AppManager.prototype.stop = function() {

}