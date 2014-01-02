exports.name = 'auto-refresh';
exports.handler = autoRefresh;

var defList = undefined;

function autoRefresh(args) {
	var self = this;
	var context = self.context;

	if (!context.autoRefresh) {
		context.autoRefresh = {};
	}

	// 要把 defList 记录到全局变量是为了
	// 让文件监视部分能够正确运作
	defList = context.autoRefresh.defList;

	switch(args.name) {
		case 'query-status':
			return queryStatus(args.args);
			break;
		case 'update-status':
			return updateStatus(args.args);
			break;
		case 'query-file-name-list':
			return queryFileNameList(args.args);
			break;
		case 'update-file-name-list':
			return updateFileNameList(args.args);
			break;
		case 'query-def-list':
			return queryDefList(args.args);
			break;
		// case 'update-def-list':
		// 	return updateDefList(args.args);
		// 	break;
		default:
			return {error: 'unknwon name: ' + args.name};
	}

	function queryStatus(args) {
		var pathName = args.pathName;

		var def = find(pathName);

		if (def) {
			return {
				status: def.status
			};
		} else {
			return {
				status: undefined
			};
		}
	}

	function updateStatus(args) {
		var pathName = args.pathName;
		var status = args.status;

		var def = find(pathName);

		if (def) {
			def.status = status;
		} else {
			// 没找到
			// 创建新的
			if (!context.autoRefresh.defList) {
				context.autoRefresh.defList = [];
			}

			var defList = context.autoRefresh.defList;
			defList.push({
				pathName: pathName,
				status: status,
				fileNameList: undefined
			});
		}

		return {};
	}

	function queryFileNameList(args) {
		var pathName = args.pathName;

		var def = find(pathName);

		if (def) {
			return {
				fileNameList: def.fileNameList
			};
		} else {
			return {
				fileNameList: undefined
			};
		}

		return {};
	}

	function updateFileNameList(args) {
		var pathName = args.pathName;
		var fileNameList = args.fileNameList;

		var def = find(pathName);

		if (def) {
			// 找到了，替换其 fileNameList
			def.fileNameList = fileNameList;
		} else {
			// 没找到，创建新的
			if (!context.autoRefresh.defList) {
				context.autoRefresh.defList = [];
			}

			var defList = context.autoRefresh.defList;

			defList.push({
				pathName: pathName,
				status: undefined,
				fileNameList: fileNameList
			});
		}

		// 结束
		return {};
	}

	function queryDefList(args) {
		return {
			defList: context.autoRefresh.defList
		};
	}

	// function updateDefList(args) {
	// 	// 严格来说，用户提交的 defList 有限制
	// 	// 不允许其中任意两个 pathName 相同
	// 	// 但是这里暂时没有做检测
	// 	// TODO

	// 	var newDefList = args.defList;
	// 	context.autoRefresh.defList = newDefList;
	// 	return {};

	// 	function checkArgs() {

	// 	}
	// }

	function find(pathName) {
		// 如果 defList 还不存在则创建新的
		if (!context.autoRefresh.defList) {
			return undefined;
		}

		var defList = context.autoRefresh.defList;

		// 找到对应的 pathName 然后返回
		for (var i = 0, len = defList.length; i < len; ++i) {
			var def = defList[i];
			if (!def) continue;
			if (def.pathName === pathName) {
				// 返回找到的结果
				return def;
			}
		}

		// 没找到
		return undefined;
	}
}

// 这里是自动监视文件变动功能的实现
(function() {
	var fs = require('fs');

	// 定时检查
	setInterval(verify, 1000);

	function verify() {
		if (!defList) return;
		defList.forEach(verifyDef);
	}

	function verifyDef(def) {
		var needUpdateStatus = false;

		if (!def.fileNameList) return;

		// 检查每一个所依赖的文件
		// 只要其中有任何一个被修改了，则整个依赖关系的 status 就需要更新
		def.fileNameList.forEach(function(file) {debugger;
			var lastModify = file.lastModify;
			var newModify = undefined;

			try {
				// 获取文件最近一次修改时间
				// 注意这里 mtime 是一个 Date 对象
				// 我们只取它的数值即可
				newModify = fs.lstatSync(file.path).mtime.valueOf();
			} catch(err) {
				// 文件不存在之类的错误
			}

			if (newModify !== lastModify) {
				needUpdateStatus = true;
			}

			// 记录下新的值
			file.lastModify = newModify;
		});

		// 如果需要修改
		// 则将 status 更新为当前时间（精确到毫秒）
		if (needUpdateStatus) {
			def.status = (new Date()).toISOString();
		}
	}
})();