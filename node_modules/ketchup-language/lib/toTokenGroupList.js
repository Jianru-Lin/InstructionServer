exports.toTokenGroupList = toTokenGroupList;

function toTokenGroupList(tokenList) {
	var tokenGroupList = [],
		group = [],
		token;

	if (tokenList.length < 1) {
		return tokenGroupList;
	}

	// 其实就是以空格和换行为分割标准来分组
	for (var i = 0, len = tokenList.length; i < len; ++i) {
		token = tokenList[i];
		if (token.type === 'space' || token.type === 'return') {
			if (group.length > 0) {
				tokenGroupList.push(group);
				group = [];
			}
		} else {
			group.push(token);
		}
	}

	// 不要漏了最后一组
	if (group.length > 0) {
		tokenGroupList.push(group);
		group = [];
	}

	// 返回结果
	return tokenGroupList;
}


// var toTokenList = require('toTokenList').toTokenList;

// var t = 'element`more` attr1=`v1` attr2=v2 | HELLO TEXT!';
// var result = toTokenGroupList(map(toTokenList(t)));
// console.log(result);

// function map(tokenList) {
// 	var getTokenValue = require('getTokenValue').getTokenValue;

// 	tokenList = tokenList.map(function(token) {debugger;
// 		token.value = getTokenValue(t, token);
// 		delete token.start;
// 		delete token.end;

// 		return token;
// 	});

// 	return tokenList;
// }