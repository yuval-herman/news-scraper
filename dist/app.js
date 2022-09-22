"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const mako_1 = require("./news-providers/mako");
// getYnet().then((data) => writeFileSync("ynet.json", JSON.stringify(data)));
(0, mako_1.getMako)().then((data) => (0, fs_1.writeFileSync)("mako.json", JSON.stringify(data)));
// getWalla().then((data) => writeFileSync("walla.json", JSON.stringify(data)));
