exports.getTokenValue = getTokenValue;

function getTokenValue(srcText, token) {
	// 注意这里做了优化
	// 避免了重复获取时导致的性能下降
	
	if (token.value === undefined) {
		token.value = srcText.substring(token.start, token.end);
	}
	return token.value;
}
