import { Container } from 'hostConfig';
import { Props } from 'shared/ReactType';

export const elementPropsKey = '__Props';

const validEventTypeList = ['click'];

type EventCallback = (e: Event) => void;

interface Paths {
	capture: EventCallback[];
	bubble: EventCallback[];
}

interface SyntheticEvent extends Event {
	__stopPropagation: boolean;
}

export interface DOMElement extends Element {
	[elementPropsKey]: Props;
}

export function updateFiberProps(node: DOMElement, props: Props) {
	node[elementPropsKey] = props;
}

export function initEvent(container: Container, eventType: string) {
	if (!validEventTypeList.includes(eventType)) {
		throw new Error('invalid event type');
	}

	if (__DEV__) {
		console.log('initEvent', eventType);
	}

	container.addEventListener(eventType, (e) => {
		dispatchEvent(container, eventType, e);
	});
}

function dispatchEvent(container: Container, eventType: string, event: Event) {
	const targetElement = event.target as DOMElement;
	if (targetElement === null) {
		console.warn('targetElement is null');
		return;
	}
	// 1.收集事件回调
	const { capture, bubble } = collectPaths(
		targetElement as DOMElement,
		container,
		eventType
	);
	// 2.构造合成事件
	const se = createSyntheticEvent(event);
	// 3.触发事件（先捕获，后冒泡）
	triggerEventFlow(capture, se);
	if (!se.__stopPropagation) {
		triggerEventFlow(bubble, se);
	}
}

function getEventCallbackNameFromEventType(eventType: string) {
	return {
		click: ['onClickCapture', 'onClick']
	}[eventType];
}

function collectPaths(
	targetElement: DOMElement,
	container: Container,
	eventType: string
) {
	const paths: Paths = {
		capture: [],
		bubble: []
	};

	while (targetElement && targetElement !== container) {
		const elementProps = targetElement[elementPropsKey];
		if (elementProps) {
			const callbackNameList = getEventCallbackNameFromEventType(eventType);
			if (callbackNameList) {
				callbackNameList.forEach((callbackName, i) => {
					const eventCallback = elementProps[callbackName];
					if (eventCallback) {
						if (i === 0) {
							paths.capture.unshift(eventCallback);
						} else {
							paths.bubble.push(eventCallback);
						}
					}
				});
			}
		}
		targetElement = targetElement.parentNode as DOMElement;
	}

	return paths;
}

function createSyntheticEvent(e: Event) {
	const syntheticEvent = e as SyntheticEvent;
	syntheticEvent.__stopPropagation = false;

	const originalStopPropagation = e.stopPropagation;

	syntheticEvent.stopPropagation = () => {
		syntheticEvent.__stopPropagation = true;
		if (originalStopPropagation) {
			originalStopPropagation();
		}
	};

	return syntheticEvent;
}

function triggerEventFlow(paths: EventCallback[], se: SyntheticEvent) {
	for (let i = 0; i < paths.length; i++) {
		const callback = paths[i];
		callback.call(null, se);
		if (se.__stopPropagation) {
			break;
		}
	}
}
