// [模块]
var format = require('util').format;
var path = require('path');
var AppEngine = require('./lib/app-engine');
var config = require('./config.json');

// [变量]
var appEngine;

// [流程]
main();

// [函数]
function main() {
	// 创建 appEngine 并填写各项参数
	appEngine = new AppEngine();
	appEngine.host = config.host;
	appEngine.port = config.port;
	appEngine.appDir = path.resolve(__dirname, 'app');
	appEngine.context = {};

	// 监听基本事件
	appEngine.on('start', onStart);
	appEngine.on('listening', onListening);
	appEngine.on('stop', onStop);

	// 启动 wenEngine
	appEngine.start();

	// [函数]
	function onStart() {
		//console.log('start');
	}

	function onListening() {
		console.log(format('app engine listening on %s [%s]', appEngine.host, appEngine.port));
	}

	function onStop() {
		console.log('app engine stop');

		// 如果出错了，显示错误信息
		if (!appEngine.success) {
			console.log(appEngine.errorText);
		}
	}
}