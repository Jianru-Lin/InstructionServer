exports.toNode = toNode;

var toTokenList = require('./toTokenList').toTokenList,
	toTokenGroupList = require('./toTokenGroupList').toTokenGroupList,
	getTokenValue = require('./getTokenValue').getTokenValue,
	getTokenGroupValue = require('./getTokenGroupValue').getTokenGroupValue,
	splitTokenGroupAsAttribute = require('./splitTokenGroupAsAttribute').splitTokenGroupAsAttribute;

var htmlEscape = require('./htmlEscape').htmlEscape;

function toNode(lineText) {
	var tokenList,
		tokenGroupList,
		group,
		node;

	var firstToken,
		lastGroup,
		textToken,
		textValue;

	var attrTokenGroupList,
		attrTokenGroup;

	var attrName,
		attrValue;

	tokenList = toTokenList(lineText);

	node = {
		level: undefined,
		name: undefined,
		attrList: undefined,
		text: undefined
	};

	if (tokenList.length < 1) {
		return node;
	}

	// 分析 level
	firstToken = tokenList[0];
	if (firstToken.type === 'space') {
		node.level = firstToken.end - firstToken.start;
		tokenList.shift();
	} else {
		node.level = 0;
	}

	// 接下来的分析要先把 tokenList 重组为 tokenGroupList
	tokenGroupList = toTokenGroupList(tokenList);

	if (tokenGroupList.length < 1) {
		return node;
	}

	// 分析 text
	// 如果有，一定在最后一组，而且该组只有这一个元素
	lastGroup = tokenGroupList[tokenGroupList.length - 1];
	if (lastGroup.length === 1) {
		textToken = lastGroup[0];
		if (textToken.type === 'text') {
			textValue = getTokenValue(lineText, textToken);
			// 必须以 |: 或者 | 开头
			// 注意如果是以 | 开头是要转义的
			if (/^\|:(\s|$)/.test(textValue)) {
				node.text = textValue.substring(3);
				tokenGroupList.pop();
			} else if (/^\|(\s|$)/.test(textValue)) {
				node.text = htmlEscape(textValue.substring(2));
				tokenGroupList.pop();
			}
		}
	}

	if (tokenGroupList.length < 1) {
		return node;
	}

	// 分析 element name
	// 这一定在第一组
	node.name = getTokenGroupValue(lineText, tokenGroupList[0]);
	tokenGroupList.shift();

	if (tokenGroupList.length < 1) {
		return node;
	}

	// 分析 attrList
	attrTokenGroupList = [];
	while (tokenGroupList.length > 0) {
		var tmp = splitTokenGroupAsAttribute(lineText, tokenGroupList.shift());
		attrTokenGroupList.push(tmp);
	}

	if (attrTokenGroupList.length < 1) {
		return node;
	}

	node.attrList = [];
	for (var i = 0, len = attrTokenGroupList.length; i < len; ++i) {
		attrTokenGroup = attrTokenGroupList[i];
		attrName = attrTokenGroup.nameGroup ? getTokenGroupValue(lineText, attrTokenGroup.nameGroup) : undefined;
		attrValue = attrTokenGroup.valueGroup ? getTokenGroupValue(lineText, attrTokenGroup.valueGroup) : undefined;
		node.attrList.push({
			name: attrName,
			value: attrValue
		});
	}

	return node;
}