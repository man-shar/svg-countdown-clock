const d3 = require('d3-selection');

function makeClock(containerSelector, { targetSeconds = 20, evHandler = null, w = 300, h = 300 }) {
	const r = w / 2;
	let secsElapsed = 0;
	let times = 0;

	const clockContainer = document.querySelector(containerSelector);

	clockContainer.addEventListener('clock-reset', evHandler);

	// from https://codereview.stackexchange.com/questions/47889/alternative-to-setinterval-and-settimeout
	const rInterval = function (callback, delay) {
		const dateNow = Date.now;
		const requestAnimation = window.requestAnimationFrame;
		let start = dateNow();
		let stop;
		function intervalFunc() {
			dateNow() - start < delay || ((start += delay), callback());
			stop || requestAnimation(intervalFunc);
		}
		requestAnimation(intervalFunc);
		return {
			clear() {
				stop = 1;
			},
		};
	};

	const svg = d3
		.select(containerSelector)
		.append('div')
		.append('svg')
		.attr('width', w)
		.attr('height', h)
		.attr('class', 'clock')
		.attr('viewBox', '0 0 300 300');

	function xOffset(x) {
		return w / 2 + x;
	}

	function yOffset(y) {
		return h / 2 - y;
	}

	function makeTick(g, rEff, angle, length, type) {
		const coords = {
			x1: xOffset((rEff - length) * Math.sin(angle)),
			y1: yOffset((rEff - length) * Math.cos(angle)),
			x2: xOffset(rEff * Math.sin(angle)),
			y2: yOffset(rEff * Math.cos(angle)),
		};
		g.append('line')
			.attr('class', type)
			.attr('x1', coords.x1)
			.attr('y1', coords.y1)
			.attr('x2', coords.x2)
			.attr('y2', coords.y2);
	}

	function updateTick(el, rEff, angle, length) {
		const coords = {
			x1: xOffset((rEff - length) * Math.sin(angle)),
			y1: yOffset((rEff - length) * Math.cos(angle)),
			x2: xOffset(rEff * Math.sin(angle)),
			y2: yOffset(rEff * Math.cos(angle)),
		};

		el.transition()
			.attr('x1', coords.x1)
			.attr('y1', coords.y1)
			.attr('x2', coords.x2)
			.attr('y2', coords.y2);
	}

	function makeMarkings() {
		const g = svg.append('g').attr('class', 'markings-container');

		g.append('circle')
			.attr('class', 'background-circle')
			.attr('cx', w / 2)
			.attr('cy', h / 2)
			.attr('r', r);

		const rEff = r - 10;

		// minute marking
		for (let i = 0; i <= 3600; i += 60) {
			makeTick(g, rEff, (2 * Math.PI * i) / 60 / 60, 3, 'mark minute-mark');
		}

		// hour mark
		for (let i = 0; i <= 12; i += 1) {
			makeTick(g, rEff, (2 * Math.PI * i) / 12, 5, 'mark hour-mark');
		}
	}

	function makeNeedle() {
		const g = svg.append('g').attr('class', 'needle-container');

		const rEff = r - 12;

		const unitAngle = (2 * Math.PI) / 60 / 60;
		const fullAngle = ((2 * Math.PI) / 60 / 60) * targetSeconds;

		// make arc
		g.append('path')
			.attr('class', 'time-arc')
			.attr(
				'd',
				`M ${w / 2} ${h / 2} 
        L ${xOffset(rEff * Math.sin(fullAngle))} ${yOffset(rEff * Math.cos(fullAngle))} 
        A ${rEff} ${rEff} 0 0 0 ${w / 2} ${h / 2 - rEff}
        Z`
			);

		makeTick(g, rEff, fullAngle, r, 'needle');

		// centre circle
		g.append('circle')
			.attr('class', 'centre-circle')
			.attr('cx', w / 2)
			.attr('cy', h / 2)
			.attr('r', 5);

		function ticker() {
			return rInterval(() => {
				secsElapsed += 1;
				if (secsElapsed === targetSeconds) {
					secsElapsed = 0;
					times += 1;

					clockContainer.dispatchEvent(
						new CustomEvent('clock-reset', {
							detail: {
								secsElapsed,
								times,
							},
						})
					);
				}

				updateTick(svg.select('.needle'), rEff, (targetSeconds - secsElapsed) * unitAngle, r);
			}, 1000);
		}

		return ticker();
	}

	makeNeedle();
	makeMarkings();
}

export default makeClock;
