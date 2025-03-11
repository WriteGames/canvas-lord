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

const PI: number = Math.PI;
const PI2: number = Math.PI / 2;
const B1: number = 1 / 2.75;
const B2: number = 2 / 2.75;
const B3: number = 1.5 / 2.75;
const B4: number = 2.5 / 2.75;
const B5: number = 2.25 / 2.75;
const B6: number = 2.625 / 2.75;

export const Ease = Object.freeze({
	quadIn: (t: number): number => t * t,
	quadOut: (t: number): number => -t * (t - 2),
	quadInOut: (t: number): number => {
		return t <= 0.5 ? t * t * 2 : 1 - --t * t * 2;
	},

	cubeIn: (t: number): number => t * t * t,
	cubeOut: (t: number): number => 1 + --t * t * t,
	cubeInOut: (t: number): number => {
		return t <= 0.5 ? t * t * t * 4 : 1 + --t * t * t * 4;
	},

	quartIn: (t: number): number => t * t * t * t,
	quartOut: (t: number): number => 1 - (t -= 1) * t * t * t,
	quartInOut: (t: number): number => {
		return t <= 0.5
			? t * t * t * t * 8
			: (1 - (t = t * 2 - 2) * t * t * t) / 2 + 0.5;
	},

	quintIn: (t: number): number => t * t * t * t * t,
	quintOut: (t: number): number => (t = t - 1) * t * t * t * t + 1,
	quintInOut: (t: number): number => {
		return (t *= 2) < 1
			? (t * t * t * t * t) / 2
			: ((t -= 2) * t * t * t * t + 2) / 2;
	},

	sineIn: (t: number): number => -Math.cos(PI2 * t) + 1,
	sineOut: (t: number): number => Math.sin(PI2 * t),
	sineInOut: (t: number): number => -Math.cos(PI * t) / 2 + 0.5,

	bounceIn: (t: number): number => {
		t = 1 - t;
		if (t < B1) return 1 - 7.5625 * t * t;
		if (t < B2) return 1 - (7.5625 * (t - B3) * (t - B3) + 0.75);
		if (t < B4) return 1 - (7.5625 * (t - B5) * (t - B5) + 0.9375);
		return 1 - (7.5625 * (t - B6) * (t - B6) + 0.984375);
	},
	bounceOut: (t: number): number => {
		if (t < B1) return 7.5625 * t * t;
		if (t < B2) return 7.5625 * (t - B3) * (t - B3) + 0.75;
		if (t < B4) return 7.5625 * (t - B5) * (t - B5) + 0.9375;
		return 7.5625 * (t - B6) * (t - B6) + 0.984375;
	},
	bounceInOut: (t: number): number => {
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

	circIn: (t: number): number => -(Math.sqrt(1 - t * t) - 1),
	circOut: (t: number): number => Math.sqrt(1 - (t - 1) * (t - 1)),
	circInOut: (t: number): number => {
		return t <= 0.5
			? (Math.sqrt(1 - t * t * 4) - 1) / -2
			: (Math.sqrt(1 - (t * 2 - 2) * (t * 2 - 2)) + 1) / 2;
	},

	expoIn: (t: number): number => Math.pow(2, 10 * (t - 1)),
	expoOut: (t: number): number => -Math.pow(2, -10 * t) + 1,
	expoInOut: (t: number): number => {
		return t < 0.5
			? Math.pow(2, 10 * (t * 2 - 1)) / 2
			: (-Math.pow(2, -10 * (t * 2 - 1)) + 2) / 2;
	},

	backIn: (t: number): number => t * t * (2.70158 * t - 1.70158),
	backOut: (t: number): number => 1 - --t * t * (-2.70158 * t - 1.70158),
	backInOut: (t: number): number => {
		t *= 2;
		if (t < 1) return (t * t * (2.70158 * t - 1.70158)) / 2;
		t--;
		return (1 - --t * t * (-2.70158 * t - 1.70158)) / 2 + 0.5;
	},
});

/* eslint-enable no-param-reassign -- we assign to t in many of the funtions */
