import { ReactElementType } from 'shared/ReactType';
import { FiberNode, createFiberFromElement } from './fiber';
import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import { HostText } from './workTags';
import { ChildDeletion, Placement } from './fiberFlags';
import { createWorkInProgress } from './fiber';

type ExistingChildren = Map<string | number, FiberNode>;

function ChildReconciler(shouldTrackEffects: boolean) {
	function deleteRemainingChildren(
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null
	) {
		if (!shouldTrackEffects) {
			return;
		}

		let childToDelete = currentFirstChild;
		while (childToDelete !== null) {
			deleteChild(returnFiber, childToDelete);
			childToDelete = childToDelete.sibling;
		}
		return null;
	}

	function reconcileSingleElement(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		element: ReactElementType
	) {
		const key = element.key;
		// update
		while (currentFiber !== null) {
			if (currentFiber.key === key) {
				if (element.$$typeof === REACT_ELEMENT_TYPE) {
					if (currentFiber.type === element.type) {
						// 直接复用fiber
						const existing = useFiber(currentFiber, element.props);
						existing.return = returnFiber;
						deleteRemainingChildren(returnFiber, currentFiber.sibling);
						return existing;
					}
					// type不一致，不能复用fiber，删除旧的fiber
					deleteRemainingChildren(returnFiber, currentFiber);
					break;
				} else {
					throw new Error('reconcileSingleElement: unknown element type');
				}
			} else {
				// key不一致，不能复用fiber，删除旧的fiber
				deleteChild(returnFiber, currentFiber);
				currentFiber = currentFiber.sibling;
			}
		}

		// 创建新的fiber
		const fiber = createFiberFromElement(element);
		fiber.return = returnFiber;
		return fiber;
	}

	function reconcileSingleTextNode(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		content: string | number
	) {
		while (currentFiber !== null) {
			if (currentFiber.tag === HostText) {
				// 直接复用fiber
				const existing = useFiber(currentFiber, { content });
				existing.return = returnFiber;
				deleteRemainingChildren(returnFiber, currentFiber.sibling);
				return existing;
			}
			// 删除旧的fiber
			deleteChild(returnFiber, currentFiber);
			currentFiber = currentFiber.sibling;
		}

		// 创建新的fiber
		const fiber = new FiberNode(HostText, { content }, null);
		fiber.return = returnFiber;
		return fiber;
	}

	function placeSingleChild(fiber: FiberNode) {
		if (shouldTrackEffects && fiber.alternate === null) {
			fiber.flags |= Placement;
		}
		return fiber;
	}

	function deleteChild(returnFiber: FiberNode, childToDelete: FiberNode) {
		if (!shouldTrackEffects) {
			return;
		}

		const deletions = returnFiber.deletions;

		if (deletions === null) {
			returnFiber.deletions = [childToDelete];
			returnFiber.flags |= ChildDeletion;
		} else {
			deletions.push(childToDelete);
		}
	}

	function updateFromMap(
		returnFiber: FiberNode,
		existingChildren: ExistingChildren,
		index: number,
		element: ReactElementType
	): FiberNode | null {
		// host text
		const keyToUse = element.key === null ? index : element.key;
		const before = existingChildren.get(keyToUse);
		if (typeof element === 'string' || typeof element === 'number') {
			if (before) {
				if (before.tag === HostText) {
					existingChildren.delete(keyToUse);
					return useFiber(before, { content: element });
				}

				return new FiberNode(HostText, { content: element }, null);
			}
		}

		// react element
		if (typeof element === 'object' && element !== null) {
			switch (element.$$typeof) {
				case REACT_ELEMENT_TYPE: {
					if (before) {
						if (before.type === element.type) {
							existingChildren.delete(keyToUse);
							return useFiber(before, element.props);
						}
					}

					return createFiberFromElement(element);
				}
			}
		}

		// TODO: Array
		if (Array.isArray(element) && __DEV__) {
			console.warn('updateFromMap: array not supported');
		}
		return null;
	}

	function reconcileChildrenArray(
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null,
		newChild: any[]
	) {
		// 最后一个可复用fiber在current中的index
		let lastPlacedIndex = 0;
		// 创建的最后一个fiber
		let lastNewFiber = null;
		// 创建的第一个fiber
		let firstNewFiber = null;

		// 1.将currentFirstChild转换成map
		const existingChildren: ExistingChildren = new Map();
		let current = currentFirstChild;
		while (current !== null) {
			if (current.key !== null) {
				existingChildren.set(current.key, current);
			} else {
				existingChildren.set(current.index, current);
			}
			current = current.sibling;
		}
		// 2.遍历newChildren，如果在map中找到对应的fiber，复用fiber，否则创建新的fiber
		for (let i = 0; i < newChild.length; i++) {
			const after = newChild[i];
			const newFiber = updateFromMap(returnFiber, existingChildren, i, after);
			if (newFiber === null) {
				continue;
			}
			// 3.标记移动还是插入
			newFiber.index = i;
			newFiber.return = returnFiber;

			if (lastNewFiber === null) {
				lastNewFiber = newFiber;
				firstNewFiber = newFiber;
			} else {
				lastNewFiber.sibling = newFiber;
				lastNewFiber = lastNewFiber.sibling;
			}

			if (!shouldTrackEffects) {
				continue;
			}

			const current = newFiber.alternate;
			if (current !== null) {
				const oldIndex = current.index;
				if (oldIndex < lastPlacedIndex) {
					// move
					newFiber.flags |= Placement;
					continue;
				} else {
					lastPlacedIndex = oldIndex;
				}
			} else {
				// mount
				newFiber.flags |= Placement;
			}
		}
		// 4.标记删除
		existingChildren.forEach((child) => deleteChild(returnFiber, child));
		return firstNewFiber;
	}

	return function reconcileChildFibers(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		newChild?: ReactElementType
	) {
		if (typeof newChild === 'object' && newChild !== null) {
			switch (newChild.$$typeof) {
				case REACT_ELEMENT_TYPE:
					return placeSingleChild(
						reconcileSingleElement(returnFiber, currentFiber, newChild)
					);

				default:
					if (__DEV__) {
						console.warn('reconcileChildFibers: unknown child type', newChild);
					}
					break;
			}

			if (Array.isArray(newChild)) {
				return reconcileChildrenArray(returnFiber, currentFiber, newChild);
			}
		}

		if (typeof newChild === 'string' || typeof newChild === 'number') {
			return placeSingleChild(
				reconcileSingleTextNode(returnFiber, currentFiber, newChild)
			);
		}

		currentFiber && deleteChild(returnFiber, currentFiber);

		return null;
	};
}

function useFiber(fiber: FiberNode, pendingProps: any) {
	const clone = createWorkInProgress(fiber, pendingProps);
	clone.index = 0;
	clone.sibling = null;
	return clone;
}

export const reconcileChildFibers = ChildReconciler(true);
export const mountChildFibers = ChildReconciler(false);
