"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const mako_1 = require("./news-providers/mako");
const walla_1 = require("./news-providers/walla");
const ynet_1 = require("./news-providers/ynet");
(0, ynet_1.getYnet)().then((data) => (0, fs_1.writeFileSync)("ynet.json", JSON.stringify(data)));
(0, mako_1.getMako)().then((data) => (0, fs_1.writeFileSync)("mako.json", JSON.stringify(data)));
(0, walla_1.getWalla)().then((data) => (0, fs_1.writeFileSync)("walla.json", JSON.stringify(data)));
