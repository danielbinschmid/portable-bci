<template>
    <div id="line-chart">
        <canvas ref="canvas" :width="w" :height="h" ></canvas>
        <!-- <v-chart class="chart" :option="option" /> -->
    </div>
</template>

<script>
import {SmoothieChart, TimeSeries} from 'smoothie';
import {LAYOUT_DATA} from '@/data/layout_constraints'

/**
 * Dummy line chart
 */
export default {
    name: "LineChart",
    data() {
        return {
            chart: new SmoothieChart(),
            series: new TimeSeries(),   
            w: 100,
            h: 10,
            intervalID: null,
        }
    },
    beforeMount() {
        this.w = Math.min(window.innerWidth, LAYOUT_DATA.MAX_WIDTH); 
        this.h = Math.max(60, window.innerHeight / 8)
    },
    mounted() {
        this.chart.addTimeSeries(this.series);
        this.chart.streamTo(this.$refs.canvas, 250);
        this.intervalID = setInterval(this.callback, 1000);
        
    },
    destroyed() {
        clearInterval(this.intervalID);
    },
    methods: {
        callback() {
            this.series.append(Date.now(), Math.random() * 10000);
        }
    }
    
};
</script>

<style scoped>

</style>