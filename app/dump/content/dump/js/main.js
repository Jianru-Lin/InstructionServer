onload = function() {
	// 设定一下各项编辑器
	var editor = ace.edit('editor');
	editor.setTheme('ace/theme/ambiance');
	editor.getSession().setMode('ace/mode/json');
	editor.setFontSize(16);

	var jsonClient = new JsonClient;
	jsonClient.url = '/instruction';
	jsonClient.requestObj = {
		name: 'dump',
		args: {}
	};

	jsonClient.on('stop', onStop);

	jsonClient.start();

	function onStop() {
		if (jsonClient.success) {
			var jsonText = JSON.stringify(jsonClient.responseObj.context, null, 4);
			editor.setValue(jsonText, 0);
			editor.clearSelection();
		} else {
			alert(jsonClient.errorText);
		}
	}
}