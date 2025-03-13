/* eslint-disable no-param-reassign -- we assign to t in many of the funtions */

/*
Copyright (c) 2010 Chevy Ray Johnston

 Permission is hereby granted, free of charge, to any person
 obtaining a copy of this software and associated documentation
 files (the "Software"), to deal in the Software without
 restriction, including without limitation the rights to use,
 copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the
 Software is furnished to do so, subject to the following
 conditions:

 The above copyright notice and this permission notice shall be
 included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 OTHER DEALINGS IN THE SOFTWARE.
*/

// From https://github.com/useflashpunk/FlashPunk/blob/master/net/flashpunk/utils/Ease.as

const PI = Math.PI;
const PI2 = Math.PI / 2;
const B1 = 1 / 2.75;
const B2 = 2 / 2.75;
const B3 = 1.5 / 2.75;
const B4 = 2.5 / 2.75;
const B5 = 2.25 / 2.75;
const B6 = 2.625 / 2.75;

// Grabbed from https://github.com/cocos/cocos-engine/blob/v3.8.6/cocos/tween/tween-system.ts
function _makeOutIn(fnIn, fnOut) {
	return (k) => {
		if (k < 0.5) {
			return fnOut(k * 2) / 2;
		}
		return fnIn(2 * k - 1) / 2 + 0.5;
	};
}

export const Ease = Object.freeze({
	quadIn: (t) => t * t,
	quadOut: (t) => -t * (t - 2),
	quadInOut: (t) => {
		return t <= 0.5 ? t * t * 2 : 1 - --t * t * 2;
	},
	quadOutIn: (t) => {
		return _makeOutIn(Ease.quadIn, Ease.quadOut)(t);
	},

	cubeIn: (t) => t * t * t,
	cubeOut: (t) => 1 + --t * t * t,
	cubeInOut: (t) => {
		return t <= 0.5 ? t * t * t * 4 : 1 + --t * t * t * 4;
	},
	cubeOutIn: (t) => {
		return _makeOutIn(Ease.cubeIn, Ease.cubeOut)(t);
	},

	quartIn: (t) => t * t * t * t,
	quartOut: (t) => 1 - (t -= 1) * t * t * t,
	quartInOut: (t) => {
		return t <= 0.5
			? t * t * t * t * 8
			: (1 - (t = t * 2 - 2) * t * t * t) / 2 + 0.5;
	},
	quartOutIn: (t) => {
		return _makeOutIn(Ease.quartIn, Ease.quartOut)(t);
	},

	quintIn: (t) => t * t * t * t * t,
	quintOut: (t) => (t = t - 1) * t * t * t * t + 1,
	quintInOut: (t) => {
		return (t *= 2) < 1
			? (t * t * t * t * t) / 2
			: ((t -= 2) * t * t * t * t + 2) / 2;
	},
	quintOutIn: (t) => {
		return _makeOutIn(Ease.quintIn, Ease.quintOut)(t);
	},

	sineIn: (t) => -Math.cos(PI2 * t) + 1,
	sineOut: (t) => Math.sin(PI2 * t),
	sineInOut: (t) => -Math.cos(PI * t) / 2 + 0.5,
	sineOutIn: (t) => {
		return _makeOutIn(Ease.sineIn, Ease.sineOut)(t);
	},

	bounceIn: (t) => {
		t = 1 - t;
		if (t < B1) return 1 - 7.5625 * t * t;
		if (t < B2) return 1 - (7.5625 * (t - B3) * (t - B3) + 0.75);
		if (t < B4) return 1 - (7.5625 * (t - B5) * (t - B5) + 0.9375);
		return 1 - (7.5625 * (t - B6) * (t - B6) + 0.984375);
	},
	bounceOut: (t) => {
		if (t < B1) return 7.5625 * t * t;
		if (t < B2) return 7.5625 * (t - B3) * (t - B3) + 0.75;
		if (t < B4) return 7.5625 * (t - B5) * (t - B5) + 0.9375;
		return 7.5625 * (t - B6) * (t - B6) + 0.984375;
	},
	bounceInOut: (t) => {
		if (t < 0.5) {
			t = 1 - t * 2;
			if (t < B1) return (1 - 7.5625 * t * t) / 2;
			if (t < B2) return (1 - (7.5625 * (t - B3) * (t - B3) + 0.75)) / 2;
			if (t < B4)
				return (1 - (7.5625 * (t - B5) * (t - B5) + 0.9375)) / 2;
			return (1 - (7.5625 * (t - B6) * (t - B6) + 0.984375)) / 2;
		}
		t = t * 2 - 1;
		if (t < B1) return (7.5625 * t * t) / 2 + 0.5;
		if (t < B2) return (7.5625 * (t - B3) * (t - B3) + 0.75) / 2 + 0.5;
		if (t < B4) return (7.5625 * (t - B5) * (t - B5) + 0.9375) / 2 + 0.5;
		return (7.5625 * (t - B6) * (t - B6) + 0.984375) / 2 + 0.5;
	},
	bounceOutIn: (t) => {
		return _makeOutIn(Ease.bounceIn, Ease.bounceOut)(t);
	},

	circIn: (t) => -(Math.sqrt(1 - t * t) - 1),
	circOut: (t) => Math.sqrt(1 - (t - 1) * (t - 1)),
	circInOut: (t) => {
		return t <= 0.5
			? (Math.sqrt(1 - t * t * 4) - 1) / -2
			: (Math.sqrt(1 - (t * 2 - 2) * (t * 2 - 2)) + 1) / 2;
	},
	circOutIn: (t) => {
		return _makeOutIn(Ease.circIn, Ease.circOut)(t);
	},

	expoIn: (t) => Math.pow(2, 10 * (t - 1)),
	expoOut: (t) => -Math.pow(2, -10 * t) + 1,
	expoInOut: (t) => {
		return t < 0.5
			? Math.pow(2, 10 * (t * 2 - 1)) / 2
			: (-Math.pow(2, -10 * (t * 2 - 1)) + 2) / 2;
	},
	expoOutIn: (t) => {
		return _makeOutIn(Ease.expoIn, Ease.expoOut)(t);
	},

	backIn: (t) => t * t * (2.70158 * t - 1.70158),
	backOut: (t) => 1 - --t * t * (-2.70158 * t - 1.70158),
	backInOut: (t) => {
		t *= 2;
		if (t < 1) return (t * t * (2.70158 * t - 1.70158)) / 2;
		t--;
		return (1 - --t * t * (-2.70158 * t - 1.70158)) / 2 + 0.5;
	},
	backOutIn: (t) => {
		return _makeOutIn(Ease.backIn, Ease.backOut)(t);
	},
});

/* eslint-enable no-param-reassign -- we assign to t in many of the funtions */
