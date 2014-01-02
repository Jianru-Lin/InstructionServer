exports.toTokenList = toTokenList;

var util = require('util');

function toTokenList(text) {
	var state = 'start',
		quoteSubState = 'start',
		textSubState = 'start';

	var lastState,
		lastQuoteSubState,
		tokenStart = 0,
		tokenEnd = 0;

	var tokenList = [];

	for (var i = 0, len = text.length; i < len; ++i) {
		// 记录下当前状态，待会儿要用来进行比较
		lastState = state;
		lastQuoteSubState = quoteSubState;

		// 执行识别算法
		next(text[i]);

		// 比较识别后的状态和识别前是否一致
		// 如果不一致，则说明识别出了一个 token，需要分割出来
		// 如果一致，应该是不需要分割的，但是有一种特殊情况
		// 如果前后状态一致都是 quote 但是 quoteSubState 有变化，那么也分割
		// 另外
		// 到达了字串尾，也需要分割一下
		if (lastState !== 'start' && lastState !== state) {
			tokenEnd = i;
			tokenList.push({type: lastState, start: tokenStart, end: tokenEnd});
			tokenStart = i;
			//console.log(tokenList[tokenList.length - 1]);
		} else if (lastState === 'quote' && 
					state === 'quote' && 
					lastQuoteSubState === 'end' &&
					quoteSubState !== 'end') {
			tokenEnd = i;
			tokenList.push({type: lastState, start: tokenStart, end: tokenEnd});
			tokenStart = i;
		}

		if (i === text.length - 1) {
			tokenEnd = i + 1;
			tokenList.push({type: state, start: tokenStart, end: tokenEnd});
			tokenStart = i;
			//console.log(tokenList[tokenList.length - 1]);
		}
	}

	return tokenList;

	function next(c) {
		var isSpace = c === ' ' || c === '	',
			isReturn = c === '\r' || c === '\n',
			isQuote = c === '`',
			isText = !isSpace && !isReturn && !isQuote;

		// 在 textSubState 状态的判断中会用到
		var isVBar = c === '|';

		// 执行状态转换
		if (state === 'start') {
			graph();
		} else if (state === 'return') {
			graph();
		} else if (state === 'space') {
			graph();
		} else if (state === 'quote') {
			quoteSubGraph();
		} else if (state === 'text'){
			textSubGraph();
		}

		// 执行状态内动作
		//console.log('(' + c + ', ' + state + ')');
	
		function graph() {
			if (isSpace) {
				state = 'space';
			} else if (isReturn) {
				state = 'return'; 
			} else if (isQuote) {
				state = 'quote';
			} else if (isText) {
				state = 'text';
				if (isVBar) {
					textSubState = 'start';
				} else {
					textSubState = 'stop';
				}
			}
		}

		function quoteSubGraph() {
			var isBackSlash = c === '\\',
				isQuote = c === '`',
				isNormal = !isBackSlash && !isQuote;

			var state = quoteSubState;

			if (state === 'start') {
				if (isBackSlash) {
					state = 'escape-start';
				} else if (isQuote) {
					state = 'end';
				} else {
					state = 'normal';
				}
			} else if (state === 'escape-start') {
				state = 'escape-end';
			} else if (state === 'escape-end') {
				if (isBackSlash) {
					state = 'escape-start';
				} else if (isQuote) {
					state = 'end';
				} else {
					state = 'normal';
				}
			} else if (state === 'normal') {
				if (isBackSlash) {
					state = 'escape-start';
				} else if (isQuote) {
					state = 'end';
				} else {
					state = 'normal';
				}
			} else if (state === 'end') {
				state = 'start';
				graph();
			}

			quoteSubState = state;
		}

		function textSubGraph() {
			var isColon = c === ':';

			if (textSubState === 'start') {
				if (isSpace) {
					textSubState = 'eText';
				} else if (isColon) {
					textSubState = 'rTextMaybe';
				} else {
					textSubState = 'stop';
					graph();
				}
			} else if (textSubState === 'rTextMaybe') {
				if (isSpace) {
					textSubState = 'rText';
				} else {
					textSubState = 'stop';
					graph();
				}
			} else if (textSubState === 'eText') {
				if (!isReturn) {
					textSubState = 'eText';
				} else {
					textSubState = 'stop';
					graph();
				}
			} else if (textSubState === 'rText') {
				if (!isReturn) {
					textSubState = 'rText';
				} else {
					textSubState = 'stop';
					graph();
				}
			} else if (textSubState === 'stop') {
				textSubState = 'stop';
				graph();
			}
		}
	}
}
