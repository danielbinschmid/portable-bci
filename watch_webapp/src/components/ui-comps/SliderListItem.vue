<template>
    <div id="slider-list-item">
        <v-list-item>
            <v-divider class="divider-style" />
            <v-subheader> {{ name }} </v-subheader>
            <v-divider class="divider-style" />
        </v-list-item>

        <v-list-item>
            <v-slider
                v-model="sliderVal"
                :color="layout_data.GREEN"
                :track-color="layout_data.PLAIN_WHITE"
                :thumb-color="layout_data.GREEN"
                thumb-label
                :min="min"
                :max="max"
                :step="step"
            >
            </v-slider>
        </v-list-item>
    </div>
</template>

<script>
import { LAYOUT_DATA } from "@/data/layout_constraints";
export default {
    name: "SliderListItem",
    props: {
        sliderVal: Number,
        name: String,
        min: Number,
        max: Number,
        step: Number,
    },
    model: {
        prop: "sliderVal",
        event: "sliderValChange",
    },
    data() {
        return {
            content: this.value,
            layout_data: LAYOUT_DATA,
        };
    },
    watch: {
        sliderVal() {
            this.$emit("sliderValChange", this.sliderVal);
        },
    },
};
</script>

<style scoped>
.divider-style {
    margin: 5%;
}
</style>