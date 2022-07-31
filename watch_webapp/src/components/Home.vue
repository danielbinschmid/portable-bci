<template>
    <div id="home">
        <!-- <ble-view /> -->
        <simple-card
            :icon="'mdi-cctv'"
            :isMenuOpened="started"
            :popupName="'MENU'"
            @openMenu="start()"
            topMargin
            bottomMargin
            :colorCard="layout.ORANGE"
            :colorText="layout.WHITE_BACKGROUND"
        >
            <overlay-back-button @exit="end()" />
            <v-list-item>
                <v-divider />
                <div
                    class="mdc-typography-styles-overline"
                    :style="{
                        color: layout.GREEN,
                    }"
                >
                    MENU
                </div>
                <v-divider />
            </v-list-item>
            <div v-for="(item, i) in pages" :key="i">
                <select-list-item
                    :name="item"
                    :selected="currentPage == item"
                    @select="setPage(item)"
                />
            </div>
        </simple-card>
    </div>
</template>

<script>
import OverlayBackButton from "./ui-comps/OverlayBackButton.vue";
import SimpleCard from "./ui-comps/SimpleCard.vue";
import SelectListItem from "./ui-comps/SelectListItem.vue";
export default {
    components: { OverlayBackButton, SimpleCard, SelectListItem },
    name: "Home",
    data() {
        var pages = ["muse", "start"];
        return {
            layout: window.layout,
            currentPage: "home",
            pages: pages,
            started: false,
            logs: [],
        };
    },
    methods: {
        start() {
            if (!this.started) {
                this.started = true;
            }
        },
        end() {
            this.started = false;
        },
        setPage(page) {
            this.currentPage = page;
            this.$emit("setPage", page);
        },
    },
};
</script>

<style scoped>
.centered-input >>> input {
    text-align: center;
}

.mdc-typography-styles-overline {
    font-family: unquote("Roboto");
    font-size: 10;
    letter-spacing: 1.25px;
}
</style>