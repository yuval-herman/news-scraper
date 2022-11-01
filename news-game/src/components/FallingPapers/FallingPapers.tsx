import { memo, useEffect, useRef } from "react";
import newspaper1 from "../../assets/newspaper1.svg";
import newspaper2 from "../../assets/newspaper2.svg";
import newspaper3 from "../../assets/newspaper3.svg";
import newspaper4 from "../../assets/newspaper4.svg";
import newspaper5 from "../../assets/newspaper5.svg";
import style from "./FallingPapers.module.scss";

const papers = [newspaper1, newspaper2, newspaper3, newspaper4, newspaper5];

function FallingPapers(props: { amount?: number }) {
	const papersRef = useRef<HTMLImageElement[]>([]);
	const handler = (idx: number) => (e: React.FormEvent<HTMLImageElement>) => {
		const next = papersRef.current[idx + 1];
		if (next) {
			next.focus();
		}
	};
	useEffect(() => {
		if (!papersRef.current[0].style.top) {
			for (let i = 0; i < papersRef.current.length; i++) {
				const x = Math.random() * 100 + "vw";
				const y = Math.round(Math.random() * 200 - 200) + "vh";
				papersRef.current[i].style.translate = x + " " + y;
				papersRef.current[i].style.rotate = Math.random() * 360 + "deg";
			}
		}
		const papersInterval = setInterval(() => {
			for (let i = 0; i < papersRef.current.length; i++) {
				// Get previous [x,y] coordinates
				const paperSpeed = parseFloat(
					papersRef.current[i].getAttribute("paper-speed")!
				);
				let [x, y] = papersRef.current[i].style.translate
					.split(" ")
					.map((value) => parseFloat(value || "0")) as [number, number];
				y += paperSpeed * 5 + 5;

				if (y >= 110) {
					y = -20;
					papersRef.current[i].style.display = "none";
					papersRef.current[i].style.rotate = Math.random() * 360 + "deg";
					x = Math.random() * 100;
				} else {
					papersRef.current[i].style.display = "unset";
				}
				papersRef.current[i].style.translate = `${x}vw ${y}vh`;
			}
		}, 1000);
		return () => clearInterval(papersInterval);
	});

	return (
		<div className={style.main}>
			{Array(props.amount ?? 5)
				.fill(null)
				.map((_, i) => (
					<img
						key={i}
						className={style.paper}
						src={papers[i % papers.length]}
						ref={(el) => (papersRef.current[i] = el!)}
						paper-speed={Math.random()}
						alt=""
						onChange={handler(i)}
					/>
				))}
		</div>
	);
}

export default memo(FallingPapers);
