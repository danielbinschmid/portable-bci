<template>
    <div id="OverlayBackButton">
        <v-list-item
            :style="{
                paddingTop: layout_data.SMALL_PADDING_TOP,
                paddingBottom: bottomPadding ? layout_data.SMALL_PADDING_TOP: '0px'
            }"
        >
            <v-btn
                class="center"
                color="#038C8C"
                text
                rounded
                outlined
                x-large
                @click="exit()"
            >
                <v-icon> mdi-close-circle-multiple-outline </v-icon>
            </v-btn>
        </v-list-item>
    </div>
</template>

<script>
import {LAYOUT_DATA} from "@/data/layout_constraints"
export default {
    name: "OverlayBackButton",
    props: {
        bottomPadding: Boolean
    },
    data() {
        return {
            layout_data: LAYOUT_DATA
        }
       
    },
    methods: {
        exit() {
            this.$emit("exit")
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
</style>