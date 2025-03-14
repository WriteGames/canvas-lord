/* Canvas Lord v0.5.3 */
import { Vec2 } from '../math/index.js';
export const copyObject = (obj) => {
    const { data: rawData } = obj;
    let data;
    switch (true) {
        case rawData instanceof Vec2:
            data = rawData.clone();
            break;
        default:
            data = rawData;
            break;
    }
    const newObj = structuredClone(obj);
    newObj.data = data;
    return newObj;
};
// TODO: rename to registerComponent? And then do something with that?
// TODO: how should prerequisites be handled? ie rect needs pos2D maybe, and then adding that component needs to either add an initial pos2D or warn/error that there isn't one there
export const createComponent = (initialState) => Object.freeze(copyObject({
    data: initialState,
}));
export const pos2D = createComponent(Vec2.zero);
const drawable = {
    angle: 0,
    scaleX: 1,
    scaleY: 1,
    originX: 0,
    originY: 0,
};
const style = {
    type: 'fill',
    color: 'white',
};
export const staticImage = createComponent({
    imageSrc: null,
    ...drawable,
});
export const image = createComponent({
    imageSrc: null,
    frame: 0,
    frameW: 0,
    frameH: 0,
    ...drawable,
});
export const rect = createComponent({
    width: 0,
    height: 0,
    ...drawable,
    ...style,
});
export const circle = createComponent({ radius: 0, ...drawable, ...style });
export const moveEightComponent = createComponent({
    originX: 30,
    originY: 90,
    dt: 0,
});
// TODO: how do I do a component group??
//# sourceMappingURL=components.js.map