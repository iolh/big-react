import { Dispatch, Dispatcher } from 'react/src/currentDispatcher';
import { FiberNode } from './fiber';
import internals from 'shared/internals';
import {
	UpdateQueue,
	createUpdate,
	createUpdateQueue,
	enqueueUpdate,
	processUpdateQueue
} from './updateQueue';
import { Action } from 'shared/ReactType';
import { scheduleUpdateOnFiber } from './workloop';

interface Hook {
	memoizedState: any;
	updateQueue: unknown;
	next: Hook | null;
}

let currentRenderingFiber: FiberNode | null = null;
let workInProgressHook: Hook | null = null;
let currentHook: Hook | null = null;

const { currentDispatcher } = internals;
export function renderWithHooks(wip: FiberNode) {
	// 赋值
	currentRenderingFiber = wip;
	wip.memoizedState = null;

	const current = wip.alternate;
	if (current !== null) {
		// update
		wip.memoizedState = current.memoizedState;
		currentDispatcher.current = HooksDispatcherOnUpdate;
	} else {
		// mount
		currentDispatcher.current = HooksDispatcherOnMount;
	}

	const Component = wip.type;
	const props = wip.pendingProps;
	const children = Component(props);

	// 重置
	currentRenderingFiber = null;
	workInProgressHook = null;
	currentHook = null;
	return children;
}

const HooksDispatcherOnMount: Dispatcher = {
	useState: mountState
};
const HooksDispatcherOnUpdate: Dispatcher = {
	useState: updateState
};

function mountState<State>(
	initialState: (() => State) | State
): [State, Dispatch<State>] {
	// 1. 找到当前useState对应的hook
	const hook: Hook = mountWorkInProgressHook();

	let memoizedState;
	if (initialState instanceof Function) {
		memoizedState = initialState();
	} else {
		memoizedState = initialState;
	}

	const queue = createUpdateQueue();
	hook.updateQueue = queue;
	hook.memoizedState = memoizedState;

	// @ts-ignore
	const dispatch = dispatchSetState.bind(null, currentRenderingFiber, queue);
	queue.dispatch = dispatch;

	return [memoizedState, dispatch];
}
function updateState<State>(): [State, Dispatch<State>] {
	// 1. 找到当前useState对应的hook
	const hook: Hook = updateWorkInProgressHook();

	// 2. 计算新的state
	const queue = hook.updateQueue as UpdateQueue<State>;
	const pending = queue.shared.pending;

	if (pending !== null) {
		const { memoizedState } = processUpdateQueue(hook.memoizedState, pending);

		hook.memoizedState = memoizedState;
	}

	return [hook.memoizedState, queue.dispatch as Dispatch<State>];
}

function mountWorkInProgressHook() {
	const hook: Hook = {
		memoizedState: null,
		updateQueue: null,
		next: null
	};

	// first hook
	if (workInProgressHook === null) {
		if (currentRenderingFiber === null) {
			throw new Error(
				'Hooks can only be called inside of the body of a function component.'
			);
		} else {
			workInProgressHook = hook;
			currentRenderingFiber.memoizedState = workInProgressHook;
		}
	} else {
		// append hook
		workInProgressHook.next = hook;
		workInProgressHook = hook;
	}

	return workInProgressHook;
}

function updateWorkInProgressHook() {
	let nextCurrentHook: Hook | null;
	if (currentHook === null) {
		if (currentRenderingFiber === null) {
			throw new Error('Rendered more hooks than during the previous render.');
		}
		const current = currentRenderingFiber.alternate;
		if (current !== null) {
			nextCurrentHook = current.memoizedState;
		} else {
			nextCurrentHook = null;
		}
	} else {
		nextCurrentHook = currentHook.next;
	}

	currentHook = nextCurrentHook;

	if (nextCurrentHook === null) {
		throw new Error(
			'Rendered more hooks than during the previous render.',
			currentRenderingFiber?.type
		);
	}

	const nextHook: Hook = {
		memoizedState: currentHook?.memoizedState,
		updateQueue: currentHook?.updateQueue,
		next: null
	};

	// first hook
	if (workInProgressHook === null) {
		if (currentRenderingFiber === null) {
			throw new Error(
				'Hooks can only be called inside of the body of a function component.'
			);
		} else {
			workInProgressHook = nextHook;
			currentRenderingFiber.memoizedState = workInProgressHook;
		}
	} else {
		// append hook
		workInProgressHook.next = nextHook;
		workInProgressHook = nextHook;
	}

	return workInProgressHook;
}

function dispatchSetState<State>(
	fiber: FiberNode,
	updateQueue: UpdateQueue<State>,
	action: Action<State>
) {
	const update = createUpdate(action);
	enqueueUpdate(updateQueue, update);
	scheduleUpdateOnFiber(fiber);
}
