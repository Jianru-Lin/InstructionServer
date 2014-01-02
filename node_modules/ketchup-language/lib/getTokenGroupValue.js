exports.getTokenGroupValue = getTokenGroupValue;

var getTokenValue = require('./getTokenValue').getTokenValue,
	unescapeQuote = require('./unescapeQuote').unescapeQuote;

function getTokenGroupValue(srcText, tokenGroup) {
	if (tokenGroup.length < 1) {
		return '';
	}

	var strList = [],
		token,
		tokenValue;

	for (var i = 0, len = tokenGroup.length; i < len; ++i) {
		token = tokenGroup[i];
		tokenValue = getTokenValue(srcText, token);

		// 对 quote 类型需要特殊处理
		if (token.type === 'quote') {
			// 注意这里在反转义之前需要去掉前后反引号
			strList.push(unescapeQuote(tokenValue.substring(1, tokenValue.length-1)));
		} else {
			strList.push(tokenValue);
		}
	}

	return strList.join('');
}