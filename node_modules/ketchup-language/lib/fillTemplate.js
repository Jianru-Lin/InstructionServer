exports.fillTemplate = fillTemplate;

function fillTemplate(templateRoot, obj) {
	execNode(undefined, templateRoot, obj);
}

function execNode(parentNode, node, obj) {
	var pattern = /^@([^$]+)/g;
	var match = pattern.exec(node.name);
	if (match) {
		// 执行节点修改过程
		obj[match[1]](parentNode, node);
	}

	// 针对子节点也进行修改过程
	if (node.children && node.children.length > 0) {
		for (var i = 0, len = node.children.length; i < len; ++i) {
			execNode(node, node.children[i], obj);
		}
	}
}