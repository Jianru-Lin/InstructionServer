var self = {
	requestEditor: undefined,
	responseEditor: undefined
};

onload = function() {
	// 设定一下请求编辑器
	self.requestEditor = ace.edit('request-editor');
	self.requestEditor.setTheme('ace/theme/cobalt');
	self.requestEditor.getSession().setMode('ace/mode/json');
	self.requestEditor.setFontSize(16);

	// 设定一下响应编辑器
	self.responseEditor = ace.edit('response-editor');
	self.responseEditor.setTheme('ace/theme/ambiance');
	self.responseEditor.getSession().setMode('ace/mode/json');
	self.responseEditor.setFontSize(16);
	self.responseEditor.setReadOnly(true);
}

function send() {
	var requestObj = undefined;
	if (!getRequestObj()) return;

	// 清空输出区域
	clearResponseEditor();

	// 启动请求过程
	var jsonClient = new JsonClient();
	jsonClient.url = '/instruction';
	jsonClient.requestObj = requestObj;
	jsonClient.on('stop', onStop);

	jsonClient.start();

	function getRequestObj() {
		var text = self.requestEditor.getValue();
		if (!text) return false;
		try {
			requestObj = JSON.parse(text);
		} catch(err) {
			alert(err.toString());
			return false;
		}

		return true;
	}

	function clearResponseEditor() {
		self.responseEditor.setValue('');
	}

	function onStop() {
		if (!jsonClient.success) {
			alert(jsonClient.errorText);
			return;
		}

		var responseText = JSON.stringify(jsonClient.responseObj, null, 4);
		self.responseEditor.setValue(responseText);
		self.responseEditor.clearSelection();
	}
}