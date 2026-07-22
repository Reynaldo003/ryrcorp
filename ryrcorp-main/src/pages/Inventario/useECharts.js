// src/pages/Inventario/useECharts.js
import { useEffect, useRef } from "react";
import * as echarts from "echarts";

export function useECharts(option, { loading = false, onEvents } = {}) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (!chartRef.current) {
      chartRef.current = echarts.init(containerRef.current);
    }

    const handleResize = () => chartRef.current?.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (!chartRef.current) return;

    if (loading) {
      chartRef.current.showLoading("default", {
        text: "Cargando...",
        color: "#131E5C",
        textColor: "#475569",
        maskColor: "rgba(255, 255, 255, 0.8)",
      });
    } else {
      chartRef.current.hideLoading();
      if (option) {
        chartRef.current.setOption(option, true);
      }
    }
  }, [option, loading]);

  // ── Eventos interactivos ──────────────────────────────────────────────────
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !onEvents) return;

    Object.entries(onEvents).forEach(([evento, fn]) => {
      chart.on(evento, fn);
    });

    return () => {
      Object.entries(onEvents).forEach(([evento, fn]) => {
        chart.off(evento, fn);
      });
    };
  }, [onEvents]);

  useEffect(() => {
    return () => {
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, []);

  return containerRef;
}