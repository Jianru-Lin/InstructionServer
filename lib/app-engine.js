// [导出]
exports = module.exports = AppEngine;

// [模块]
var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var Engine = require('./engine');
var express = require('express');
var App = require('./app');
var fs = require('fs');
var path = require('path');

// [流程]
inherits(AppEngine, EventEmitter);


// [函数]
function AppEngine() {
	// 外部参数
	this.host = undefined;
	this.port = undefined;
	this.appDir = undefined;

	// 内部变量
	this.context = undefined;
	this.appList = undefined;
	this.expressApp = undefined;

	// 对外的状态
	this.status = undefined;
	this.success = undefined;
	this.errorText = undefined;

	this.warningList = undefined;

	// 内部状态
	this.isStopping = undefined;
}

AppEngine.prototype.start = function() {
	var self = this;

	// 检查参数
	// TODO

	// 避免重入
	if (self.status === 'start') {
		return false;
	}

	// 清理一下运行环境
	clean();

	// 发出 start 事件通知订阅者
	self.status = 'start';
	self.emit('start');

	// 如果外部没有指明 context 的话，就用一个空对象
	self.context = self.context || {};

	// 开始
	work();

	return true;

	function clean() {
		// 清理内部变量
		self.appList = undefined;
		self.expressApp = undefined;
		self.engine = undefined;

		// 清理对外的状态
		self.status = undefined;
		self.success = undefined;
		self.errorText = undefined;

		self.warningList = undefined;

		// 清理内部状态
		self.isStopping = undefined;
	}

	function work() {
		initAppList();
		initExpressApp();

		function initAppList() {
			self.appList = [];
			self.warningList = [];

			var subDir;
			try {
				// 列举出 appDir 下的所有目录（实际上也可能包含文件）
				subDir = fs.readdirSync(self.appDir);
			} catch(err) {
				// 出错了，显示一下提示信息，但是这不影响后续步骤的执行
				self.warningList.push('[initAppList] ' + err.toString());
			}

			subDir = subDir || [];

			// 针对每一个目录创建对应的 App 对象
			subDir.forEach(function(dir) {
				var dirAbs = path.resolve(self.appDir, dir);
				var app = new App();
				app.dir = dirAbs;

				// 加入列表
				self.appList.push(app);

				// 启动解析过程
				app.start();
			});
		}

		function initExpressApp() {
			// 创建 express 服务器，并插入我们自己的中间件
			self.expressApp = express();
			self.expressApp.use(express.json());
			self.expressApp.use(middleWare);

			// 启动 express 服务器
			// 注意这里把 listen() 的返回值记录了下来
			// 它是一个普通的 nodejs http server
			// 待会儿关闭的时候要用到
			var __server__ = self.expressApp.listen(self.port, self.host);
			self.expressApp.__server__ = __server__;

			// 监听几个事件
			__server__.on('listening', onExpressAppListening);
			__server__.on('error', onExpressAppError);
		}

	}

	function onExpressAppListening() {
		// 发出 listening 事件通知订阅者
		self.emit('listening');
	}

	function onExpressAppError(err) {
		// 进入停止状态并通知订阅者
		self.status = 'stop';
		self.success = false;
		self.errorText = err.toString();
		self.isStopping = undefined;

		self.emit('stop');
	}

	function middleWare(req, res, next) { 

		// 这里是为了避免重复计算，因此提前转换好
		// 另外，这里有一个隐式的限制—— page.def 中的 method 必须是小写的才能匹配到
		var reqMethodLower = req.method.toLowerCase();
		var reqPath = req.path;	// 这里是 express 实现的属性

		if (!instruction() && !page()) {
			content();
		}

		function instruction() {
			if (req.method !== 'POST' || req.path !== '/instruction') {
				// 不属于 instruction 请求
				return false;
			}

			// 既然是 instruction 必须要有 JSON 请求对象
			if (!req.body) {
				res.statusCode = 400;
				res.end();
				return;
			}

			// 执行指令之前，我们需要找到该指令对应的 handler
			var instructions = req.body;
			setupHandler(instructions);

			self._exec(instructions);

			// 返回所有的结果
			var result;
			if (Array.isArray(instructions)) {
				result = [];
				instructions.forEach(function(instruction) {
					// 指令执行出错则返回出错信息
					// 否则返回结果
					if (instruction.error) {
						result.push({
							errorText: instruction.error.toString()
						});
					} else {
						result.push(instruction.result);
					}
				});
			} else {
				var instruction = instructions;
				if (instruction.error) {
					result = {
						errorText: instruction.error.toString()
					};
				} else {
					result = instruction.result;
				}
			}

			// 发送响应
			var text = JSON.stringify(result);
			var length = Buffer.byteLength(text, 'utf8');

			res.statusCode = 200;
			res.setHeader('Content-Type', 'application/json;charset=UTF-8');
			res.setHeader('Content-Length', length);

			res.end(text);

			// 处理完毕
			return true;

			function setupHandler(instructions) {
				if (!self.appList || !instructions) return;

				// 这里的算法可优化
				// 目前只是作为一个原型实现
				if (Array.isArray(instructions)) {
					instructions.forEach(setupOne);
				} else {
					setupOne(instructions);
				}

				function setupOne(target) {
					// 遍历整个 appList 针对每一个 app 的 instructionList 中的每一个 instruction
					// 进行比较，如果 name 相同，则就采用该 instruction 对应的 handler

					var found = false;

					for (var i = self.appList.length - 1; i >= 0 && !found; --i) {
						var app = self.appList[i];
						if (!app.instructionList) continue;

						for (var j = app.instructionList.length - 1; j >= 0 && !found; --j) {
							var instruction = app.instructionList[j];
							if (target.name === instruction.name) {
								target.handler = instruction.handler;

								// 找到了，不再继续搜索
								found = true;
								break;
							}
						}
					}
				}
			}
		}

		function page() {
			// 遍历整个 appList 如果某个 page 的 def 中匹配了当前请求的特征
			// 则交给该 page 处理，并且忽略剩下的 page
			// 这里的代码有很多可以优化的地方，目前只是一个原型实现
			if (!self.appList) return;

			var found = false;

			for (var i = self.appList.length - 1; i >= 0 && !found; --i) {
				var app = self.appList[i];
				if (!app.pageList) continue;

				for (var j = app.pageList.length - 1; j >= 0 && !found; --j) {
					var page = app.pageList[j];
					if (match(page)) {
						// 交给该页面去处理
						try {
							page.respond(req, res, self.context);
						} catch(err) {
							self.warningList.push('[page.respond] ' + err.toString());
							// 以防万一结束响应
							try {
								res.end();
							} catch(_) {}
						}

						// 不再继续匹配其他部分
						found = true;
						break;
					}
				}
			}

			// 如果已经找到了，并交由相应的页面处理了
			// 那么返回 true
			return found === true;

			function match(page) {
				// 注意，如果页面提供了 def 但是没有提供 respond
				// 即使 def 中定义的模式匹配，但是也是无效的
				if (!page || !page.def || !page.respond) return false;

				// 然后是路径要匹配
				// 路径是一个列表，其中任何一个元素可以是字符串也可以是正则表达式
				var pathPatternList = page.def[reqMethodLower];
				if (!Array.isArray(pathPatternList)) return false;
				
				for (var i = pathPatternList.length - 1; i >= 0; --i) {
					var pathPattern = pathPatternList[i];

					// 如果是字符串就直接按照字面匹配
					// 如果是对象则认为是正则表达式来进行匹配
					if (typeof pathPattern === 'string') {
						if (pathPattern === reqPath) return true;
					} else if (typeof pathPattern === 'object' && pathPattern.constructor === RegExp) {
						if (pathPattern.test(reqPath)) return true;
					}
				}

				// 不匹配
				return false;
			}
		}

		function content() {
			// 遍历整个 appList 如果某个 app 的 contentList 中 的 content 的 relativePath
			// 匹配了当前请求的路径，则返回该路径对应的文件
			// 这里的代码有很多可以优化的地方，目前只是一个原型实现
			if (!self.appList) {
				res.status = 404;
				res.end();
				return;
			}

			var found = false;

			for (var i = self.appList.length - 1; i >= 0 && !found; --i) {
				var app = self.appList[i];
				if (!app.contentList) continue;

				for (var j = app.contentList.length - 1; j >= 0 && !found; --j) {
					var content = app.contentList[j];
					if (content.relativePath === reqPath) {
						// 计算出完整路径并返回该文件
						
						var contentFileName = path.resolve(app.contentDir, '.' + content.relativePath);
						res.sendfile(contentFileName);	// 这里是由 express 支持的

						// 不再继续匹配其他部分
						found = true;
						break;
					}
				}
			}

			if (!found) {
				// 没找到，返回 404
				res.statusCode = 404;
				res.end();				
			}
		}
	}
}

AppEngine.prototype.stop = function() {
	var self = this;

	// 如果没有开始则不执行任何操作
	if (self.status !== 'start') {
		return false;
	}

	// 防止重入
	if (self.isStopping) {
		return false;
	}

	// 标记为停止中
	self.isStopping = true;

	// 这里只需要关闭 expressApp 即可
	// pageManager 和 engine 都不用管
	self.expressApp.__server__.close(function() {
		self.status = 'stop';
		self.success = true;
		self.errorText = undefined;
		self.isStopping = undefined;

		self.emit('stop');
	});
}

// 对于一条 instruction
// 必须有对应的 handler 来进行处理
// 另外，指令运行的结果会存储在 result 中
// 如果执行过程中出现错误，则会将错误存储在 error 中
AppEngine.prototype._exec = function(instructions) {
	var self = this;

	// instructions 可以是单个指令
	// 也可以是指令序列
	if (!Array.isArray(instructions)) {
		instructions = [instructions];
	}

	instructions.forEach(function(instruction) {
		if (!instruction.handler) {
			instruction.error = new Error('handler not found');
			return;
		}
		
		// 所有的指令都共用相同的上下文
		instruction.context = self.context;

		try {
			var args = instruction.args;
			var result = instruction.handler(args);
			instruction.result = result;
		} catch(err) {
			instruction.error = err;
		}
	});
}