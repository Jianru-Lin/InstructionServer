// [导出]
exports = module.exports = Engine;

// [模块]
var path = require('path');

// [函数]
function Engine() {
	this.instructionHandler = undefined;
	this.context = undefined;
	this.isRunning = undefined;
	this.instructionList = [];
	this.nextIndex = 0;

	// 指令模块文件所在目录
	this.moduleDir = undefined;
}

Engine.prototype._append = function(instructions) {
	var self = this;

	if (!Array.isArray(instructions)) {
		return;
	}

	if (instructions.length < 1) {
		return;
	}

	while(instructions.length > 0) {
		self.instructionList.push(instructions.shift());
	}
	
	self._run();
}

Engine.prototype._run = function() {
	var self = this;

	// 已经在执行了，无需重复调用
	if (self.isRunning) {
		return;
	}

	self.isRunning = true;
	execNextInstruction();

	function execNextInstruction() {
		// 队列中没有需要执行的指令
		if (self.nextIndex >= self.instructionList.length) {
			self.isRunning = false;
			return;
		}

		// 取出一条指令
		var ins = self.instructionList[self.nextIndex++];

		// 根据指令名找到对应的处理过程
		var handler = self.instructionHandler[ins.name];

		// 哦哦，没有找到对应名字的处理过程
		// 忽略它
		if (!handler) {
			console.log('unknown instruction: ' + ins.name);
			return;
		}

		// 调用处理过程
		try {
			ins.context = self.context;
			ins.result = handler.call(ins, ins.args);
			ins.callback(ins.result);
		} catch(err) {
			console.log(err.toString());
		}

		// 继续执行下一条指令
		process.nextTick(execNextInstruction);
	}
}

/* 扩展部分 */

// # callback(result)
Engine.prototype.append = function(instructions, callback) {
	var self = this;

	if (!Array.isArray(instructions)) {
		instructions = [instructions];
	}

	for (var i = instructions.length - 1; i >= 0; --i) {
		var ins = instructions[i];
		// 这样做才能够保证查询后能把结果返回给客户端
		ins.callback = callback;

		// 加载指令对应的模块
		var modulePath = path.resolve(self.moduleDir , ins.name + '.js');
		var m = reloadModule(modulePath);
		self.instructionHandler[m.name] = m.handler;
	}

	// 把指令加入到引擎中去
	self._append(instructions);

	// [函数]
	// 重新加载模块，并且忽略缓存
	function reloadModule(modulePath) {
		// 删除模块缓存
		delete require.cache[modulePath];

		// 重新加载
		return require(modulePath);
	}
}