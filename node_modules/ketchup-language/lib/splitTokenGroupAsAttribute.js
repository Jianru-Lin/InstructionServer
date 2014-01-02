exports.splitTokenGroupAsAttribute = splitTokenGroupAsAttribute;

var getTokenValue = require('./getTokenValue').getTokenValue;

function splitTokenGroupAsAttribute(srcText, tokenGroup) {
	var attrTokenGroup = {
		nameGroup: undefined,
		valueGroup: undefined
	};

	var token,
		tokenValue,
		seq,
		pos;

	var centerToken;

	if (tokenGroup.length < 1) {
		return attrTokenGroup;
	}

	// 找到第一块含有等号 = 的 text 类型的 token
	// 然后从此处断开
	for (var i = 0, len = tokenGroup.length; i < len; ++i) {
		token = tokenGroup[i];
		if (token.type !== 'text') continue;
		tokenValue = getTokenValue(srcText, token);
		pos = tokenValue.indexOf('=');
		if (pos === -1) continue;
		// pos 已经知道了
		// 再记录下 seq 就可以中断查找了
		seq = i;
		break;
	}

	// 如果不存在等号则全部当作 nameGroup
	if (seq === undefined) {
		attrTokenGroup.nameGroup = [];
		for (var i = 0, len = tokenGroup.length; i < len; ++i) {
			attrTokenGroup.nameGroup.push(tokenGroup[i]);
		}
	} else {
		// 如果存在等号则首先将等号所在的 token 前的部分当作 nameGroup
		// 然后将 token 在等号处一分为二，前半部分也作为 nameGroup 的一部分
		// 后面的部分以及余下的全部 token 则当作 valueGroup

		attrTokenGroup.nameGroup = [];
		for (var i = 0; i < seq; ++i) {
			attrTokenGroup.nameGroup.push(tokenGroup[i]);
		}

		centerToken = tokenGroup[seq];

		if (pos > 0) {
			attrTokenGroup.nameGroup.push({
				type: centerToken.type,
				start: centerToken.start,
				end: centerToken.start + pos
			});
		}

		attrTokenGroup.valueGroup = [];
		if (pos + 1 < (centerToken.end - centerToken.start)) {
			attrTokenGroup.valueGroup.push({
				type: centerToken.type,
				start: centerToken.start + pos + 1,
				end: centerToken.end
			});
		}

		for (var i = seq + 1, len = tokenGroup.length; i < len; ++i) {
			attrTokenGroup.valueGroup.push(tokenGroup[i]);
		}
	}

	return attrTokenGroup;
}
