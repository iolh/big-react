import {
	Container,
	appendChildToContainer,
	commitUpdate,
	removeChild,
	Instance,
	insertChildToContainer
} from 'hostConfig';
import { FiberNode, FiberRootNode } from './fiber';
import {
	ChildDeletion,
	MutationMask,
	NoFlags,
	Placement,
	Update
} from './fiberFlags';
import {
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText
} from './workTags';

let nextEffect: FiberNode | null = null;

export const commitMutationEffects = (finishedWork: FiberNode) => {
	nextEffect = finishedWork;

	while (nextEffect !== null) {
		const child: FiberNode | null = nextEffect.child;
		if (
			(nextEffect.subtreeFlags & MutationMask) !== NoFlags &&
			child !== null
		) {
			nextEffect = child;
		} else {
			up: while (nextEffect !== null) {
				commitMutationEffectsOnFiber(nextEffect);
				const sibling: FiberNode | null = nextEffect.sibling;
				if (sibling !== null) {
					nextEffect = sibling;
					break up;
				}
				nextEffect = nextEffect.return;
			}
		}
	}
};

const commitMutationEffectsOnFiber = (finishedWork: FiberNode) => {
	const flags = finishedWork.flags;
	if ((flags & Placement) !== NoFlags) {
		commitPlacement(finishedWork);
		finishedWork.flags &= ~Placement;
	}
	if ((flags & Update) !== NoFlags) {
		commitUpdate(finishedWork);
		finishedWork.flags &= ~Update;
	}
	if ((flags & ChildDeletion) !== NoFlags) {
		const deletions = finishedWork.deletions;
		if (deletions !== null) {
			deletions.forEach(commitDeletion);
		}
		finishedWork.flags &= ~ChildDeletion;
	}

	// if ((flags & MutationMask) !== NoFlags) {
	// 	commitWork(finishedWork);
	// }
};

const commitPlacement = (finishedWork: FiberNode) => {
	if (__DEV__) {
		console.warn('commitPlacement: ', finishedWork);
	}

	const hostParent = getHostParent(finishedWork);
	const sibling = getHostSibling(finishedWork);
	if (hostParent !== null) {
		insertOrAppendPlcementNodeInToContainer(finishedWork, hostParent, sibling);
	}
};

function getHostSibling(fiber: FiberNode) {
	let node: FiberNode = fiber;
	findSibing: while (true) {
		while (node.sibling === null) {
			const parent = node.return;
			if (
				parent === null ||
				parent.tag === HostRoot ||
				parent.tag === HostComponent
			) {
				return null;
			}
			node = parent;
		}

		node.sibling.return = node.return;
		node === node.sibling;
		while (node.tag !== HostText && node.child !== null) {
			// 向下找
			if ((node.flags & Placement) !== NoFlags) {
				node.child.return = node;
				node = node.child;
				continue findSibing;
			} else {
				node.child.return = node;
				node = node.child;
			}
		}

		if ((node.flags & Placement) === NoFlags) {
			return node.stateNode;
		}
	}
}

function commitDeletion(childToDeletion: FiberNode) {
	let rootHostNode: FiberNode | null = null;
	// 递归子树
	commitNestedComponent(childToDeletion, (unmountFiber) => {
		switch (unmountFiber.tag) {
			case HostComponent:
				if (rootHostNode === null) {
					rootHostNode = unmountFiber;
				}
				return;
			case HostText:
				if (rootHostNode === null) {
					rootHostNode = unmountFiber;
				}
				return;
			case FunctionComponent:
				return;

			default:
				if (__DEV__) {
					console.warn('commitDeletion: unknown tag', unmountFiber);
				}
				break;
		}
	});
	// 移除DOM节点

	if (rootHostNode !== null) {
		const hostParent = getHostParent(childToDeletion);
		if (hostParent !== null) {
			removeChild((rootHostNode as FiberNode).stateNode, hostParent);
		}
	}
	childToDeletion.return = null;
	childToDeletion.child = null;
}

function commitNestedComponent(
	root: FiberNode,
	onCommitUnmount: (node: FiberNode) => void
) {
	let node = root;
	while (true) {
		onCommitUnmount(node);
		if (node.child !== null) {
			// 向下遍历
			node.child.return = node;
			node = node.child;
			continue;
		}
		// 不用遍历
		if (node === root) {
			return;
		}
		while (node.sibling === null) {
			if (node.return === null || node.return === root) {
				return;
			}
			// 向上遍历
			node = node.return;
		}
		// 遍历兄弟节点
		node.sibling.return = node.return;
		node = node.sibling;
	}
}

function getHostParent(fiber: FiberNode): Container | null {
	let parent = fiber.return;
	while (parent) {
		const parentTag = parent.tag;
		if (parentTag === HostComponent) {
			return parent.stateNode as Container;
		} else if (parentTag === HostRoot) {
			return (parent.stateNode as FiberRootNode).container;
		}
		parent = parent.return;
	}

	if (__DEV__) {
		console.warn('getHostParent failed', fiber);
	}

	return null;
}

function insertOrAppendPlcementNodeInToContainer(
	finishedWork: FiberNode,
	hostParent: Container,
	before?: Instance
) {
	if (finishedWork.tag === HostComponent || finishedWork.tag === HostText) {
		if (before) {
			insertChildToContainer(hostParent, finishedWork.stateNode, before);
		} else {
			appendChildToContainer(hostParent, finishedWork.stateNode);
		}
		return;
	}

	const child = finishedWork.child;
	if (child !== null) {
		insertOrAppendPlcementNodeInToContainer(child, hostParent);
		let sibling = child.sibling;
		while (sibling !== null) {
			insertOrAppendPlcementNodeInToContainer(sibling, hostParent);
			sibling = sibling.sibling;
		}
	}
}
