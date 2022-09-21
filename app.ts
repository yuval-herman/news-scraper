import { writeFileSync } from "fs";
import { getMako } from "./news-providers/mako";
import { getWalla } from "./news-providers/walla";
import { getYnet } from "./news-providers/ynet";

getYnet().then((data) => writeFileSync("ynet.json", JSON.stringify(data)));
getMako().then((data) => writeFileSync("mako.json", JSON.stringify(data)));
getWalla().then((data) => writeFileSync("walla.json", JSON.stringify(data)));
