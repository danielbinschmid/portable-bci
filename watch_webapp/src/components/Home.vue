<template>
    <div id="home">
        <!-- <ble-view /> -->
        <simple-card 
            :icon="'mdi-cctv'"
            :isMenuOpened="started"
            :popupName="'NAVIGATE'"
            @openMenu="start()"
            topMargin
            bottomMargin
            :colorCard="layout_data.ORANGE"
            :colorText="layout_data.WHITE_BACKGROUND" 
        >
            <overlay-back-button @exit="end()"/>
            <div v-for="(item, i) in pages" :key="i">
                <select-list-item :name="item" :selected="currentPage == item" @select="setPage(item)" />
            </div>
        </simple-card>
    </div>
</template>

<script>
import OverlayBackButton from "./ui-comps/OverlayBackButton.vue"
import SimpleCard from "./ui-comps/SimpleCard.vue"
import SelectListItem from "./ui-comps/SelectListItem.vue"
import { LAYOUT_DATA } from "../data/layout_constraints"
export default {
    components: { OverlayBackButton, SimpleCard, SelectListItem },
    name: "Home",
    data() {
        var pages = ["muse", "start"]
        return {
            layout_data: LAYOUT_DATA,
            currentPage: "home",
            pages: pages,
            started: false,
            logs: [],
        };
    },
    methods: {
        start() { if (!this.started) { this.started = true; } },
        end() { this.started = false; },
        setPage(page) { 
            this.currentPage = page;
            this.$emit("setPage", page)
        }
    },
};
</script>

<style scoped>
    .centered-input >>> input {
      text-align: center
    }
</style>