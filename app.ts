import { writeFileSync } from "fs";

getYnet().then((data) => writeFileSync("ynet.json", JSON.stringify(data)));
getMako().then((data) => writeFileSync("mako.json", JSON.stringify(data)));
getWalla().then((data) => writeFileSync("walla.json", JSON.stringify(data)));
