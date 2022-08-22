<template>
    <div id="muse-raw-eeg">
        <v-dialog v-model="isActivated" fullscreen>
            <v-card :color="layout_data.WHITE_BACKGROUND">
                <overlay-back-button @exit="exit()" />
                <v-list-item>
                    <v-divider />
                    <div
                        class="mdc-typography-styles-overline"
                        :style="{
                            color: layout_data.GREEN,
                        }"
                    >
                        RAW EEG VIS
                    </div>
                    <v-divider />
                </v-list-item>

                <menu-list-item :text="'options'" @open="options()" />
                <div v-if="isActivated && !optionsOpened">
                    <muse-raw-eeg-vis
                        :museDevInfo="museDevInfo"
                        :minMaxRange="minMaxRange"
                    />
                </div>

                <v-dialog v-model="optionsOpened" fullscreen>
                    <v-card :color="layout_data.WHITE_BACKGROUND">
                        <overlay-back-button @exit="options()" />
                        <slider-list-item
                            v-model="minMaxRange"
                            :max="1000"
                            :min="50"
                            :step="50"
                            :name="'μV - range'"
                        />
                    </v-card>
                </v-dialog>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
import SliderListItem from "@/components/ui-comps/SliderListItem.vue";
import MenuListItem from "@/components/ui-comps/MenuListItem.vue";
import MuseRawEegVis from "@/components/visualization/MuseRawEEGVis.vue";
import { LAYOUT_DATA } from "@/data/layout_constraints";
import OverlayBackButton from "@/components/ui-comps/OverlayBackButton.vue";
export default {
    name: "MuseRawEeg",
    props: {
        isActivated: Boolean,
        museDevInfo: undefined,
    },
    components: {
        SliderListItem,
        MenuListItem,
        MuseRawEegVis,
        OverlayBackButton,
    },
    data() {
        return {
            layout_data: LAYOUT_DATA,
            optionsOpened: false,
            minMaxRange: 400,
        };
    },
    methods: {
        exit() {
            this.$emit("exit");
        },
        options() {
            this.optionsOpened = !this.optionsOpened;
        },
    },
};
</script>

<style scoped>
</style>