<template>
    <div id="menu-list-item">
        <v-list-item>
            <v-list-item-content>
                <v-btn
                    class="center"
                    :color="layout_data.GREEN"
                    text
                    rounded
                    outlined
                    x-large
                    @click="open()"
                >
                    <v-icon
                        :color="layout_data.GREEN"
                        :size="layout_data.MAX_WIDTH / 10"
                        class="abitright-2"
                    >
                        mdi-playlist-edit
                    </v-icon>
                    {{ text }}
                </v-btn>
            </v-list-item-content>
        </v-list-item>
    </div>
</template>

<script>
import { LAYOUT_DATA } from "@/data/layout_constraints"
export default {
    name: "MenuListItem",
    props: {
        text: String
    },
    data() {
        return {
            layout_data: LAYOUT_DATA
        }
    },
    methods: {
        open() {
            this.$emit("open")
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
.abitright-2 {
    margin-right: 8% !important;
    margin-left: 0%;
}
</style>