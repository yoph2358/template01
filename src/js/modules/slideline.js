import gsap from "gsap";

export function initSlideLine() {

	const jsHeadTitleTriggers = document.querySelectorAll('.jsHeadTitleTrigger');

	jsHeadTitleTriggers.forEach((jsHeadTitleTrigger) => {

		const jsLine = jsHeadTitleTrigger.querySelector('.jsLine');

		const headTL = gsap.timeline({
			scrollTrigger: {
				trigger: jsHeadTitleTrigger,
				start: 'top 70%',
			},
		});

		headTL.to(jsLine, {
			'--clipRate': '0%',
			ease: 'steps(12)',
			duration: 1.0,
		});
	});
}