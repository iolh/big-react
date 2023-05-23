import { Key, Props, Ref } from 'shared/ReactType';
import { WorkTag } from './workTags';
import { Flags, NoFlags } from './fiberFlags';
import { Container } from 'hostConfig';

export class FiberNode {
	public type: any;
	public stateNode: any;
	public alternate: FiberNode | null;
	public return: FiberNode | null;
	public sibling: FiberNode | null;
	public child: FiberNode | null;
	public index: number;
	public ref: Ref;
	public memoizedProps: Props | null;
	public flags: Flags;
	public updateQueue: unknown;

	constructor(
		public tag: WorkTag,
		public pendingProps: Props,
		public key: Key
	) {
		// 实例
		this.tag = tag;
		this.key = key;
		this.stateNode = null;
		this.type = null;

		// 树结构
		this.alternate = null;
		this.return = null;
		this.sibling = null;
		this.child = null;
		this.index = 0;

		this.ref = null;

		this.pendingProps = pendingProps;
		this.memoizedProps = null;
		this.flags = NoFlags;
	}
}

export class FiberRootNode {
	public container: Container;
	public current: FiberNode;
	public finishedWork: FiberNode | null;
	constructor(container: Container, hostRootFiber: FiberNode) {
		this.container = container;
		this.current = hostRootFiber;
		hostRootFiber.stateNode = this;
		this.finishedWork = null;
	}
}

export function createWorkInProgess(current: FiberNode, pendingProps: Props) {
	let wip = current.alternate;
	if (wip === null) {
		wip = new FiberNode(current.tag, pendingProps, current.key);
		wip.stateNode = current.stateNode;
		wip.alternate = current;
		current.alternate = wip;
	} else {
		wip.pendingProps = pendingProps;
		wip.flags = NoFlags;
	}

	wip.type = current.type;
	return wip;
}
