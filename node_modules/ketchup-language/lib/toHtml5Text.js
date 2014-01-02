exports.toHtml5Text = toHtml5Text;

var format = require('util').format,
	doubleQuoteEscape = require('./doubleQuoteEscape').doubleQuoteEscape,
	isVoidElement = require('./isVoidElement').isVoidElement;

function toHtml5Text(root) {
	var strList = ['<!DOCTYPE html>'];
	
	if (root.children === undefined || root.children.length < 1) {
		return strList[0];
	}

	// 只输出第一组
	outputNode(root.children[0]);

	// 合并成字符串返回
	return strList.join('');

	function outputNode(node) {
		var attr;

		outputTag(node, function(node) {
			// 输出文字
			if (node.text) {
				strList.push(node.text);
			}

			// 输出子元素
			if (node.children !== undefined && node.children.length > 0) {
				for (var i = 0, len = node.children.length; i < len; ++i) {
					outputNode(node.children[i]);
				}
			}
		});

		// contentCallback(node)
		function outputTag(node, contentCallback) {
			if (node.name !== undefined) {
				// 标签名
				strList.push('<' + node.name);

				// 属性列表
				if (node.attrList !== undefined && node.attrList.length > 0) {
					for (var i = 0, len = node.attrList.length; i < len; ++i) {
						attr = node.attrList[i];
						outputAttribute(attr);
					}
				}

				strList.push('>');

				// 注意 void element 是不处理子元素及文字内容的
				if (!isVoidElement(node.name)) {
					contentCallback(node);

					// 结束标签
					strList.push('</' + node.name + '>');
				}
			} else {
				// 如果节点没有名字，那么就不输出节点本身，但是节点的文字和子元素是要处理的
				contentCallback(node);
			}
		}

		function outputAttribute(attr) {
			if (attr.name) {
				strList.push(' ' + attr.name);
			}
			if (attr.value) {
				strList.push('="' + doubleQuoteEscape(attr.value) + '"');
			}
		}
	}
}