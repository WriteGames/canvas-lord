/* Canvas Lord v0.5.1 */

import { V3, addPos, scalePos, subPos, posEqual, Vec2 } from '../math/index.js';

// TODO: capacity, aka when it splits

type Quadrants<T> = [
	QuadtreeNode<T>,
	QuadtreeNode<T>,
	QuadtreeNode<T>,
	QuadtreeNode<T>,
];

type QuadIndex = 0 | 1 | 2 | 3;

type V2 = [x: number, y: number];

type ItemPositionCallback<T> = (item: T) => V2;

const arrayRemove = <T>(arr: Array<T>, value: T) => {
	const index = arr.indexOf(value);
	if (index > -1) {
		arr.splice(index, 1);
	}
	return arr;
};

export interface QuadtreeNode<T> {
	parent: QuadtreeInternalNode<T> | null;
	depth: number;
	posA: V2;
	posB: V2;
	radii: Vec2;
	midPoint: Vec2;
	rangeX: V2;
	rangeY: V2;
	itemPosCallback: ItemPositionCallback<T>;
	type: 'node' | 'leaf';
	children: T[] | Quadrants<T>;
	totalChildrenCount: number;
	quadChildrenCount: number;
	leafThreshold: number;
}

export interface QuadtreeInternalNode<T> extends QuadtreeNode<T> {
	type: 'node';
	children: Quadrants<T>;
}

export interface QuadtreeExternalNode<T> extends QuadtreeNode<T> {
	type: 'leaf';
	children: T[];
}

const QUAD_TREE_NODE_TYPE = {
	NODE: 'node',
	LEAF: 'leaf',
} as const;

const isQuadtreeNode = <T>(
	node: QuadtreeNode<T>,
): node is QuadtreeInternalNode<T> => {
	return node.type === 'node';
};

const isQuadtreeLeaf = <T>(
	node: QuadtreeNode<T>,
): node is QuadtreeExternalNode<T> => {
	return node.type === 'leaf';
};

const LEAF_THRESHOLD = 5; // set to 16 maybe?

export class QuadtreeNode<T> implements QuadtreeNode<T> {
	constructor(
		rangeX: V2,
		rangeY: V2,
		itemPosCallback: ItemPositionCallback<T>,
		leafThreshold = LEAF_THRESHOLD,
	) {
		this.recompute(rangeX, rangeY);
		this.type = QUAD_TREE_NODE_TYPE.LEAF;
		this.children = [];
		this.itemPosCallback = itemPosCallback;
		this.parent = null;
		this.depth = 0;
		this.quadChildrenCount = 0;
		this.leafThreshold = leafThreshold;
		this.totalChildrenCount = 0;
	}

	setParent(parent: QuadtreeInternalNode<T>) {
		this.parent = parent;
		this.depth = this.parent.depth + 1;
	}

	recompute(rangeX: V2, rangeY: V2) {
		const [x1, x2] = rangeX;
		const [y1, y2] = rangeY;
		this.posA = [x1, y1];
		this.posB = [x2, y2];
		this.rangeX = rangeX;
		this.rangeY = rangeY;
		this.radii = scalePos(
			new Vec2(rangeX[1] - rangeX[0], rangeY[1] - rangeY[0]),
			0.5,
		);
		this.midPoint = new Vec2(...addPos(this.posA, this.radii));
	}

	getQuadIndex(pos: V2): QuadIndex {
		const isRight = pos[0] >= this.midPoint[0];
		const isBottom = pos[1] >= this.midPoint[1];
		return ((isRight ? 1 : 0) + (isBottom ? 2 : 0)) as QuadIndex;
	}

	split() {
		if (isQuadtreeNode(this)) {
			throw new Error('cannot split a non-leaf');
		}

		const displacedChildren = (this as QuadtreeExternalNode<T>).children;
		this.totalChildrenCount -= displacedChildren.length;

		this.type = 'node';
		this.children = Array.from({ length: 4 }, (_, i) => {
			const pointsX = [this.posA[0], this.midPoint[0], this.posB[0]];
			const pointsY = [this.posA[1], this.midPoint[1], this.posB[1]];

			const xIndex = i % 2;
			const yIndex = Math.floor(i / 2);

			const rangeX = [pointsX[xIndex], pointsX[xIndex + 1]] as V2;
			const rangeY = [pointsY[yIndex], pointsY[yIndex + 1]] as V2;

			const node = new QuadtreeNode<T>(
				rangeX,
				rangeY,
				this.itemPosCallback,
				this.leafThreshold,
			);
			node.setParent(this as QuadtreeInternalNode<T>);
			return node;
		}) as Quadrants<T>;

		this.recomputeCounts();

		displacedChildren.forEach((c) => this.addChild(c));
	}

	combine() {
		if (isQuadtreeLeaf(this)) {
			throw new Error('cannot combine a leaf (no quads)');
		}

		this.type = 'leaf';
		this.children = (this as QuadtreeInternalNode<T>).children.flatMap(
			(quad) => {
				if (!isQuadtreeLeaf(quad)) {
					throw new Error('child was not a leaf');
				}
				return quad.children;
			},
		);
		this.quadChildrenCount = 0;
		this.parent?.recomputeCounts();
	}

	expand() {
		// @ts-ignore
		const newRangeX = scalePos(this.rangeX, 2);
		// @ts-ignore
		const newRangeY = scalePos(this.rangeY, 2);
		// @ts-ignore
		this.recompute(newRangeX, newRangeY);

		if (this.type === 'leaf') return;

		const oldQuads = (this as QuadtreeInternalNode<T>).children;
		// this.type = 'leaf';
		// this.children = [];

		const xPoints = [this.posA[0], this.midPoint[0], this.posB[0]] as V3;
		const yPoints = [this.posA[1], this.midPoint[1], this.posB[1]] as V3;
		oldQuads.forEach((quad, quadIndex) => {
			const xIndex = quadIndex % 2;
			const yIndex = Math.floor(quadIndex / 2);
			const newRangeX = xPoints.slice(
				xIndex,
				xIndex + 2,
			) as unknown as V2;
			const newRangeY = yPoints.slice(
				yIndex,
				yIndex + 2,
			) as unknown as V2;
			quad.recompute(newRangeX, newRangeY);
		});
	}

	// TODO: you could do sdf with depth and it would work really well!
	findNode(pos: V2): QuadtreeExternalNode<T> | null {
		// TODO: replace with sdf
		const tooLeft = pos[0] < this.posA[0];
		const tooRight = pos[0] >= this.posB[0];
		const tooUp = pos[1] < this.posA[1];
		const tooDown = pos[1] >= this.posB[1];

		if (tooLeft || tooRight || tooUp || tooDown) return null;

		if (isQuadtreeLeaf(this)) return this;

		const children = (this as QuadtreeInternalNode<T>).children;

		const quadIndex = this.getQuadIndex(pos);
		return children[quadIndex].findNode(pos);
	}

	findChildNode(child: T): QuadtreeExternalNode<T> | null {
		return this.findNode(this.itemPosCallback(child));
	}

	getChildAtPos(pos: V2) {
		const node = this.findNode(pos);
		// return node;
		return node?.children.find((child) => {
			return posEqual(this.itemPosCallback(child), pos);
		});
	}

	hasChild(child: T) {
		const node = this.findChildNode(child);
		if (node === null) return false;
		return node.children.includes(child);
	}

	addUniqueChild(child: T) {
		if (this.hasChild(child)) return;
		this.addChild(child);
	}

	recomputeCounts() {
		if (this.type === 'leaf') {
			throw new Error('only call this for leaf nodes');
		}

		const { children } = this as QuadtreeInternalNode<T>;

		this.quadChildrenCount = children
			.filter((c) => c.type === 'leaf')
			.reduce((acc, c) => acc + c.totalChildrenCount, 0);

		const { totalChildrenCount } = this;
		this.totalChildrenCount = children.reduce(
			(acc, c) => acc + c.totalChildrenCount,
			0,
		);

		if (totalChildrenCount === this.totalChildrenCount) return;

		if (this.parent) {
			this.parent.recomputeCounts();
		}
	}

	addChild(child: T) {
		// TODO: rework this to make sure that we don't ever have an infinitely expanding node
		let node = this.findChildNode(child);
		if (node === null) {
			if (this.type === 'leaf') {
				throw new Error('uh oh');
			}
		}

		// get bigger if needed
		for (let i = 0; i < 5; ++i) {
			if (node === null) {
				this.expand();
				// this.addChild(child);
				// break;
			}
			node = this.findChildNode(child);
		}

		if (node == null) return;

		// add child
		node.children.push(child);
		node.totalChildrenCount = node.children.length;
		node.parent?.recomputeCounts();

		// split node if ready
		if (node.children.length > node.leafThreshold) {
			node.split();
		}
	}

	removeChild(child: T) {
		const node = this.findChildNode(child);
		if (node === null) {
			throw new Error('child does not exist in this tree');
		}

		const children = node.children;
		if (!children.includes(child)) return;

		const before = children.length;
		arrayRemove(children, child);

		node.totalChildrenCount = node.children.length;
		node.parent?.recomputeCounts();

		if (node.parent) {
			const parentQuads = node.parent.children;

			const isEligibleToCombine = parentQuads.every((quad) => {
				return quad.type === 'leaf';
			});
			if (
				isEligibleToCombine &&
				node.parent.quadChildrenCount <= this.leafThreshold
			) {
				node.parent.combine();
			}
		}
	}
}
