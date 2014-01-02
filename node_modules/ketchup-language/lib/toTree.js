exports.toTree = toTree;

function toTree(nodeList) {
	var root = {
		children: undefined
	};

	var node,
		parentNode;

	if (nodeList.length < 1) {
		return root;
	}

	for (var i = nodeList.length - 1; i >= 0; --i) {
		node = nodeList[i];
		parentNode = findParent(node, i);
		// 注意要倒着添加
		unshiftChild(parentNode, node);
	}

	// 返回根节点
	return root;

	function findParent(node, i) {
		// 向上找第一个 level 比自己小的元素
		// 如果找不到就返回 root
		var parentNode;

		for (var j = i - 1; j >= 0; --j) {
			if (nodeList[j].level < node.level) {
				parentNode = nodeList[j];
				break;
			}
		}

		parentNode = parentNode || root;
		return parentNode;
	}

	function unshiftChild(parentNode, childNode) {
		if (parentNode.children === undefined) {
			parentNode.children = [];
		}
		parentNode.children.unshift(childNode);
	}
}