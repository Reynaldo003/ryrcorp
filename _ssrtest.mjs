import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Bar,
  BarChart,
  BarStack,
  XAxis,
  YAxis,
} from "recharts";

const data = [
  { name: "VW Cordoba", a: 14, b: 25, c: 27, d: 134 },
  { name: "VW Tuxpan", a: 2, b: 10, c: 15, d: 27 },
];

function chart(reversed) {
  return React.createElement(
    BarChart,
    { width: 700, height: 300, layout: "vertical", data, margin: { top: 10, right: 60, left: 10, bottom: 10 } },
    React.createElement(XAxis, { type: "number" }),
    React.createElement(YAxis, {
      type: "category",
      dataKey: "name",
      width: 120,
      reversed,
      tick: false,
      axisLine: false,
      tickLine: false,
    }),
    React.createElement(
      BarStack,
      { stackId: "p", radius: 6 },
      React.createElement(Bar, { dataKey: "a", stackId: "p" }),
      React.createElement(Bar, { dataKey: "d", stackId: "p" })
    )
  );
}

const markup = renderToStaticMarkup(chart(false));
console.log(markup.replace(/></g, ">\n<"));
