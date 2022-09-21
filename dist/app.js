"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
getYnet().then((data) => (0, fs_1.writeFileSync)("ynet.json", JSON.stringify(data)));
getMako().then((data) => (0, fs_1.writeFileSync)("mako.json", JSON.stringify(data)));
getWalla().then((data) => (0, fs_1.writeFileSync)("walla.json", JSON.stringify(data)));
