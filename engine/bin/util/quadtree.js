import { addPos, scalePos, posEqual } from './math.js';
const arrayRemove = (arr, value) => {
    const index = arr.indexOf(value);
    if (index > -1) {
        arr.splice(index, 1);
    }
    return arr;
};
const QUAD_TREE_NODE_TYPE = {
    NODE: 'node',
    LEAF: 'leaf',
};
const isQuadtreeNode = (node) => {
    return node.type === 'node';
};
const isQuadtreeLeaf = (node) => {
    return node.type === 'leaf';
};
const LEAF_THRESHOLD = 5; // set to 16 maybe?
export class QuadtreeNode {
    constructor(rangeX, rangeY, itemPosCallback, leafThreshold = LEAF_THRESHOLD) {
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
    setParent(parent) {
        this.parent = parent;
        this.depth = this.parent.depth + 1;
    }
    recompute(rangeX, rangeY) {
        const [x1, x2] = rangeX;
        const [y1, y2] = rangeY;
        this.posA = [x1, y1];
        this.posB = [x2, y2];
        this.rangeX = rangeX;
        this.rangeY = rangeY;
        this.radii = scalePos([rangeX[1] - rangeX[0], rangeY[1] - rangeY[0]], 0.5);
        this.midPoint = addPos(this.posA, this.radii);
    }
    getQuadIndex(pos) {
        const isRight = pos[0] >= this.midPoint[0];
        const isBottom = pos[1] >= this.midPoint[1];
        return ((isRight ? 1 : 0) + (isBottom ? 2 : 0));
    }
    split() {
        if (isQuadtreeNode(this)) {
            throw new Error('cannot split a non-leaf');
        }
        const displacedChildren = this.children;
        this.type = 'node';
        this.children = Array.from({ length: 4 }, (_, i) => {
            const pointsX = [this.posA[0], this.midPoint[0], this.posB[0]];
            const pointsY = [this.posA[1], this.midPoint[1], this.posB[1]];
            const xIndex = i % 2;
            const yIndex = Math.floor(i / 2);
            const rangeX = [pointsX[xIndex], pointsX[xIndex + 1]];
            const rangeY = [pointsY[yIndex], pointsY[yIndex + 1]];
            const node = new QuadtreeNode(rangeX, rangeY, this.itemPosCallback, this.leafThreshold);
            node.setParent(this);
            return node;
        });
        displacedChildren.forEach((c) => this.addChild(c));
        if (this.parent) {
            this.parent.quadChildrenCount -= displacedChildren.length;
        }
    }
    combine() {
        if (isQuadtreeLeaf(this)) {
            throw new Error('cannot combine a leaf (no quads)');
        }
        this.type = 'leaf';
        this.children = this.children.flatMap((quad) => {
            if (!isQuadtreeLeaf(quad)) {
                throw new Error('child was not a leaf');
            }
            return quad.children;
        });
        this.quadChildrenCount -= this.children.length;
        if (this.parent) {
            this.parent.quadChildrenCount += this.children.length;
        }
    }
    expand() {
        const newRangeX = scalePos(this.rangeX, 2);
        const newRangeY = scalePos(this.rangeY, 2);
        this.recompute(newRangeX, newRangeY);
        if (this.type === 'leaf')
            return;
        const oldQuads = this.children;
        // this.type = 'leaf';
        // this.children = [];
        const xPoints = [this.posA[0], this.midPoint[0], this.posB[0]];
        const yPoints = [this.posA[1], this.midPoint[1], this.posB[1]];
        oldQuads.forEach((quad, quadIndex) => {
            const xIndex = quadIndex % 2;
            const yIndex = Math.floor(quadIndex / 2);
            const newRangeX = xPoints.slice(xIndex, xIndex + 2);
            const newRangeY = yPoints.slice(yIndex, yIndex + 2);
            quad.recompute(newRangeX, newRangeY);
        });
    }
    // TODO: you could do sdf with depth and it would work really well!
    findNode(pos) {
        // TODO: replace with sdf
        const tooLeft = pos[0] < this.posA[0];
        const tooRight = pos[0] >= this.posB[0];
        const tooUp = pos[1] < this.posA[1];
        const tooDown = pos[1] >= this.posB[1];
        if (tooLeft || tooRight || tooUp || tooDown)
            return null;
        if (isQuadtreeLeaf(this))
            return this;
        const children = this.children;
        const quadIndex = this.getQuadIndex(pos);
        return children[quadIndex].findNode(pos);
    }
    findChildNode(child) {
        return this.findNode(this.itemPosCallback(child));
    }
    getChildAtPos(pos) {
        const node = this.findNode(pos);
        // return node;
        return node?.children.find((child) => {
            return posEqual(this.itemPosCallback(child), pos);
        });
    }
    hasChild(child) {
        const node = this.findChildNode(child);
        if (node === null)
            return false;
        return node.children.includes(child);
    }
    addChild(child) {
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
        if (node == null)
            return;
        // add child
        node.children.push(child);
        if (node.parent) {
            ++node.parent.quadChildrenCount;
        }
        let addNode = node;
        while (addNode) {
            ++addNode.totalChildrenCount;
            addNode = addNode.parent;
        }
        // split node if ready
        if (node.children.length > node.leafThreshold) {
            node.split();
        }
    }
    removeChild(child) {
        const node = this.findChildNode(child);
        if (node === null) {
            throw new Error('child does not exist in this tree');
        }
        const children = node.children;
        arrayRemove(children, child);
        let removeNode = node;
        while (removeNode) {
            --removeNode.totalChildrenCount;
            removeNode = removeNode.parent;
        }
        if (node.parent) {
            const parentQuads = node.parent.children;
            --node.parent.quadChildrenCount;
            const isEligibleToCombine = parentQuads.every((quad) => {
                return quad.type === 'leaf';
            });
            if (isEligibleToCombine &&
                node.parent.quadChildrenCount <= this.leafThreshold) {
                node.parent.combine();
            }
        }
    }
}
//# sourceMappingURL=quadtree.js.map