/* Canvas Lord v0.6.1 */

import * as Collide from './collide.js';
import * as Collision from './collision.js';
import { BoxCollider } from './box-collider.js';
import { Collider, type ColliderTag } from './collider.js';
import { CircleCollider } from './circle-collider.js';
import { GridCollider } from './grid-collider.js';
import { LineCollider } from './line-collider.js';
import { PointCollider } from './point-collider.js';
import { PolygonCollider } from './polygon-collider.js';
import { RightTriangleCollider } from './right-triangle-collider.js';

export * from './collision.js';

export function isBoxCollider(collider: Collider): collider is BoxCollider {
	return collider.type === 'box';
}

export function isCircleCollider(
	collider: Collider,
): collider is CircleCollider {
	return collider.type === 'circle';
}

export function isGridCollider(collider: Collider): collider is GridCollider {
	return collider.type === 'grid';
}

export function isLineCollider(collider: Collider): collider is LineCollider {
	return collider.type === 'line';
}

export function isPointCollider(collider: Collider): collider is PointCollider {
	return collider.type === 'point';
}
export function isPolygonCollider(
	collider: Collider,
): collider is PolygonCollider {
	return collider.type === 'polygon';
}
export function isRightTriangleCollider(
	collider: Collider,
): collider is RightTriangleCollider {
	return collider.type === 'right-triangle';
}

export {
	BoxCollider,
	Collide,
	Collision,
	Collider,
	type ColliderTag,
	CircleCollider,
	GridCollider,
	LineCollider,
	PointCollider,
	PolygonCollider,
	RightTriangleCollider,
};
