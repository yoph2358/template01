import gsap from "gsap";

export function initBounce() {

	const jsBounces = document.querySelectorAll('.jsBounce');

	jsBounces.forEach((jsBounce) => {

		gsap.fromTo(
			jsBounce,

			{
				scale: 0,
				rotate: 0,
				y: 80,
				autoAlpha: 0,
			},

			{
				scale: 1,
				rotate: 0,
				y: 0,
				autoAlpha: 1,

				duration: 0.9,
				ease: 'elastic.out(1, 0.4)',

				scrollTrigger: {
					trigger: jsBounce,
					start: 'top 75%',
				},
			}
		);
	});
}