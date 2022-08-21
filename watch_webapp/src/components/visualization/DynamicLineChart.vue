<template>
    <div id="dynamic-line-chart">
        <canvas ref="canvas" :width="w" :height="h"></canvas>
        <!-- <v-chart class="chart" :option="option" /> -->
    </div>
</template>

<script>
import { SmoothieChart, TimeSeries } from "smoothie";
import { LAYOUT_DATA } from "@/data/layout_constraints";
export default {
    name: "DynamicLineChart",
    props: {
        currentVal: {val: Number, timestamp: Number},
        minMaxRange: Number,
        height: Number
    },
    data() {
        const h_ = this.height ? this.height: 10;
        return {
            chart: new SmoothieChart({
                grid: {
                    fillStyle: LAYOUT_DATA.WHITE_BACKGROUND,
                    strokeStyle: "transparent",
                    verticalSections: 0,
                },
                labels: { fillStyle: "transparent" },
                maxValue: this.minMaxRange,
                minValue: -this.minMaxRange,
            }),
            series: new TimeSeries(),
            w: 100,
            h: h_,
        };
    },
    beforeMount() {
        this.w = Math.min(window.innerWidth, LAYOUT_DATA.MAX_WIDTH);
        this.h = Math.max(60, window.innerHeight / 8);
    },
    mounted() {
        this.chart.addTimeSeries(this.series, {
            lineWidth: 2,
            strokeStyle: LAYOUT_DATA.ORANGE,
        });
        this.chart.streamTo(this.$refs.canvas, 250);
    },
    watch: {
        currentVal() {
            this.series.append(this.currentVal.timestamp, this.currentVal.val);
        }
    },
};
</script>

<style scoped>

</style>