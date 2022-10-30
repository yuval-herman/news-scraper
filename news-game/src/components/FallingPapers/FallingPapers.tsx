import { useEffect, useRef } from "react";
import style from "./FallingPapers.module.scss";
import newspaper1 from "../../assets/newspaper1.svg";
import newspaper2 from "../../assets/newspaper2.svg";
import newspaper3 from "../../assets/newspaper3.svg";
import newspaper4 from "../../assets/newspaper4.svg";
import newspaper5 from "../../assets/newspaper5.svg";

const papers = [newspaper1, newspaper2, newspaper3, newspaper4, newspaper5];

export default function FallingPapers(props: { amount?: number }) {
	const papersRef = useRef<HTMLImageElement[]>([]);
	const handler = (idx: number) => (e: React.FormEvent<HTMLImageElement>) => {
		const next = papersRef.current[idx + 1];
		if (next) {
			next.focus();
		}
	};
	useEffect(() => {
		for (let i = 0; i < papersRef.current.length; i++) {
			papersRef.current[i].style.top = Math.random() * 200 - 200 + "vh";
			papersRef.current[i].style.left = Math.random() * 100 + "vw";
			papersRef.current[i].style.rotate = Math.random() * 360 + "deg";
		}
		const papersInterval = setInterval(() => {
			for (let i = 0; i < papersRef.current.length; i++) {
				let loc: number =
					parseFloat(papersRef.current[i].style.top || "0") + 10;

				if (loc >= 110) {
					loc = -20;
					papersRef.current[i].style.display = "none";
					papersRef.current[i].style.rotate = Math.random() * 360 + "deg";
					papersRef.current[i].style.left = Math.random() * 100 + "vw";
				} else {
					papersRef.current[i].style.display = "unset";
				}
				papersRef.current[i].style.top = loc + "vh";
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
						alt=""
						onChange={handler(i)}
					/>
				))}
		</div>
	);
}
