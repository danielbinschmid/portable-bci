<template>
    <div id="loading-list-item">
        <v-list-item>
            <v-list-item-icon class="abitright-2">
                <div v-if="!isLoading">
                    <v-icon
                        :color="layout_data.GREEN"
                        class="icon"
                        :size="layout_data.MAX_WIDTH / 10"
                    >
                        {{ icon }}
                    </v-icon>
                </div>
                <div v-if="isLoading">
                    <breeding-rhombus-spinner
                        :animation-duration="1800"
                        :size="layout_data.MAX_WIDTH / 10"
                        class="icon"
                        :color="layout_data.GREEN"
                    />
                </div>
            </v-list-item-icon>
            <v-list-item-content>
                <v-btn
                    class="center"
                    :color="layout_data.GREEN"
                    text
                    rounded
                    outlined
                    x-large
                    @click="press()"
                >
                    {{ text }}
                </v-btn>
            </v-list-item-content>
        </v-list-item>
    </div>
</template>

<script>
import { LAYOUT_DATA } from "@/data/layout_constraints"
import {
    BreedingRhombusSpinner,
    HalfCircleSpinner,
} from "epic-spinners/dist/lib/epic-spinners.min.js";
export default {
    name: "LoadingListItem",
    components: {
        BreedingRhombusSpinner
    },
    props: {
        isLoading: Boolean,
        icon: String,
        text: String
    },
    data() {
        return {
            layout_data: LAYOUT_DATA
        }
    },
    methods: {
        press() {
            this.$emit("press");
        }
    }
};
</script>

<style scoped>
.center {
    margin-left: auto;
    margin-right: auto;
    width: 100%;
}
.icon {
    margin-top: 10%;
}
.abitright-2 {
    margin-right: 8% !important;
    margin-left: 0%;
}
</style>