/* Canvas Lord v0.6.1 */
import * as Collide from './collide.js';
import * as Collision from './collision.js';
import { BoxCollider } from './box-collider.js';
import { Collider } from './collider.js';
import { CircleCollider } from './circle-collider.js';
import { GridCollider } from './grid-collider.js';
import { LineCollider } from './line-collider.js';
import { PointCollider } from './point-collider.js';
import { PolygonCollider } from './polygon-collider.js';
import { RightTriangleCollider } from './right-triangle-collider.js';
export * from './collision.js';
export function isBoxCollider(collider) {
    return collider.type === 'box';
}
export function isCircleCollider(collider) {
    return collider.type === 'circle';
}
export function isGridCollider(collider) {
    return collider.type === 'grid';
}
export function isLineCollider(collider) {
    return collider.type === 'line';
}
export function isPointCollider(collider) {
    return collider.type === 'point';
}
export function isPolygonCollider(collider) {
    return collider.type === 'polygon';
}
export function isRightTriangleCollider(collider) {
    return collider.type === 'right-triangle';
}
export { BoxCollider, Collide, Collision, Collider, CircleCollider, GridCollider, LineCollider, PointCollider, PolygonCollider, RightTriangleCollider, };
//# sourceMappingURL=index.js.map