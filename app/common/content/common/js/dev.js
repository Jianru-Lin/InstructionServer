// 自动刷新功能
// 依赖于 JsonClient
(function() {
	var initialized = false;
	var lastStatus = undefined;
	var lastStartTime = new Date();

	var jsonClient = new JsonClient();
	jsonClient.url = '/instruction';
	jsonClient.requestObj = {
		name: 'auto-refresh',
		args: {
			name: 'query-status',
			args: {
				pathName: window.location.pathname
			}
		}
	};

	jsonClient.on('stop', onStop);

	// 启动
	jsonClient.start();

	function onStop() {
		if (jsonClient.success) {
			var newStatus = jsonClient.responseObj.status;
			if (!initialized) {
				lastStatus = newStatus;
				initialized = true;
			} else if (newStatus !== lastStatus) {
				window.location.reload();
			}
		}

		// 1 秒后继续发送请求
		setTimeout(function() {
			jsonClient.start();
		}, 1000);
	}
})();