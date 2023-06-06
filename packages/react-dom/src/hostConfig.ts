import { Props } from 'shared/ReactType';
import { DOMElement, updateFiberProps } from './SyntheticEvent';
import { FiberNode } from 'react-reconciler/src/fiber';
import { HostText } from 'react-reconciler/src/workTags';

export type Container = Element;
export type Instance = Element;
export type TextInstance = Text;

export const createInstance = (type: string, props: Props): Instance => {
	// TODO: 处理 props
	const element = document.createElement(type) as unknown as DOMElement;
	updateFiberProps(element, props);
	return element;
};

export const appendInitialChild = (
	parent: Instance | Container,
	child: Instance
) => {
	parent.appendChild(child);
};

export const createTextInstance = (content: string) => {
	return document.createTextNode(content);
};

export const appendChildToContainer = appendInitialChild;

export function commitUpdate(fiber: FiberNode) {
	switch (fiber.tag) {
		case HostText:
			const text = fiber.memoizedProps.content;
			commitTextUpdate(fiber.stateNode, text);
			break;

		default:
			if (__DEV__) {
				console.warn('commitUpdate: unknown tag', fiber);
			}
			break;
	}
}

function commitTextUpdate(textInstance: TextInstance, content: string) {
	textInstance.textContent = content;
}

export function removeChild(
	child: Instance | TextInstance,
	container: Container
) {
	container?.removeChild(child);
}

export function insertChildToContainer(
	container: Container,
	child: Instance,
	before: Instance
) {
	container.insertBefore(child, before);
}
