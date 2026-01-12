import type { ReactNode } from '../../node/type';
import type { IRNode, IRProps } from './types';

const buildIRProps = (node: ReactNode): IRProps => {
	const style = node.props.style;
	if (!style) {
		throw new Error('IR build requires normalized style on node props.');
	}

	const componentProperties = 'componentProperties' in node.props ? node.props.componentProperties : undefined;

	return {
		id: node.props.id,
		name: node.props.name,
		style,
		componentProperties,
	};
};

export const buildIRNode = (node: ReactNode): IRNode => {
	const children = node.children?.map((child) => buildIRNode(child));

	return {
		type: node.type,
		props: buildIRProps(node),
		children: children && children.length > 0 ? children : undefined,
	};
};
