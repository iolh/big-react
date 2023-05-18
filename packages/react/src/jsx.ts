import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import { Key, Props, Ref, ElementType } from 'shared/ReactType';

const hasOwnProperty = Object.prototype.hasOwnProperty;

const RESERVED_PROPS = {
	key: true,
	ref: true
};

function ReactElement(type: ElementType, key: Key, ref: Ref, props: Props) {
	const element = {
		$$typeof: REACT_ELEMENT_TYPE,
		type: type,
		key: key,
		ref: ref,
		props: props,
		__mark: 'neo'
	};

	return element;
}

export function createElement(
	type: ElementType,
	config: any,
	...maybeChildren: any[]
) {
	let propName;

	// Reserved names are extracted
	const props: any = {};

	let key = null;
	let ref = null;

	if (config != null) {
		ref = config.ref !== undefined ? config.ref : ref;
		key = config.key !== undefined ? '' + config.key : key;

		// Remaining properties are added to a new props object
		for (propName in config) {
			if (
				hasOwnProperty.call(config, propName) &&
				!hasOwnProperty.call(RESERVED_PROPS, propName)
			) {
				props[propName] = config[propName];
			}
		}
	}

	// Children can be more than one argument, and those are transferred onto
	// the newly allocated props object.
	const childrenLength = maybeChildren.length;
	if (childrenLength === 1) {
		props.children = maybeChildren[0];
	} else if (childrenLength > 1) {
		props.children = maybeChildren;
	}

	// Resolve default props
	if (type && type.defaultProps) {
		const defaultProps = type.defaultProps;
		for (propName in defaultProps) {
			if (props[propName] === undefined) {
				props[propName] = defaultProps[propName];
			}
		}
	}

	return ReactElement(type, key, ref, props);
}

export const jsx = createElement;
export const jsxDEV = createElement;
