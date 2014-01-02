exports.name = 'dump';
exports.handler = dump;

function dump(args) {
	return {
		context: this.context
	};
}