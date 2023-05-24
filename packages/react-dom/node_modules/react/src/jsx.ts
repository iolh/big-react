import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import {
	Key,
	Props,
	Ref,
	ElementType,
	ReactElementType
} from 'shared/ReactType';

const hasOwnProperty = Object.prototype.hasOwnProperty;

const RESERVED_PROPS = {
	key: true,
	ref: true
};

function ReactElement(
	type: ElementType,
	key: Key,
	ref: Ref,
	props: Props
): ReactElementType {
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

export function jsx(type: ElementType, config: any, maybeKey: any) {
	let propName;

	// Reserved names are extracted
	const props: any = {};

	let key = null;
	let ref = null;

	// Currently, key can be spread in as a prop. This causes a potential
	// issue if key is also explicitly declared (ie. <div {...props} key="Hi" />
	// or <div key="Hi" {...props} /> ). We want to deprecate key spread,
	// but as an intermediary step, we will use jsxDEV for everything except
	// <div {...props} key="Hi" />, because we aren't currently able to tell if
	// key is explicitly declared to be undefined or not.
	if (maybeKey !== undefined) {
		key = '' + maybeKey;
	}

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

export const jsxDEV = jsx;
