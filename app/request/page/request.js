exports.respond = respond;
exports.def = {
	get: ['/request']
};

var path = require('path');
var TemplateResponder = require('./lib/template-responder');

function respond(req, res) {
	// 根据模板生成内容返回
	var templateResponder = new TemplateResponder();
	templateResponder.fileName = path.resolve(__dirname, 'template/request.kl');
	templateResponder.dataObj = undefined;
	templateResponder.req = req;
	templateResponder.res = res;

	templateResponder.start();
}