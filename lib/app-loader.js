exports = module.exports = AppLoader;

function AppLoader() {
	// 外部参数
	this.appDir = undefined;

	// 内部变量
	this.pageDir = undefined;
	this.contentDir = undefined;

	// 对外的状态
	this.status = undefined;
	this.success = undefined;
	this.errorText = undefined;
}

AppLoader.prototype.start = function() {

}

AppLoader.prototype.stop = function() {

}