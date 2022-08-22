<template>
    <div id="select-list-item">
        <v-list-item>
            <v-list-item-icon class="abitright-2">
                <v-icon
                    :size="layout_data.MAX_WIDTH / 12"
                    :color="layout_data.GREEN"
                    class="icon"
                >
                    {{
                        selected
                            ? "mdi-access-point-check"
                            : "mdi-motion-pause-outline"
                    }}
                </v-icon>
            </v-list-item-icon>
            <v-divider vertical class="small-margin"> </v-divider>
            <v-list-item-content>
                <v-btn
                    class="center"
                    :color="layout_data.GREEN"
                    text
                    rounded
                    outlined
                    x-large
                    @click="select()"
                >
                    {{ name }}
                </v-btn>
            </v-list-item-content>
        </v-list-item>
    </div>
</template>

<script>
import { LAYOUT_DATA } from "@/data/layout_constraints"
export default {
    name: "SelectListItem",
    props: {
        selected: Boolean,
        name: String
    },
    data() {
        return {
            layout_data: LAYOUT_DATA
        }
    },
    methods: {
        select() {
            this.$emit("select");
        }
    }
};
</script>

<style scoped>
.small-margin {
    margin-top: 5%;
    margin-right: 10%;
    margin-bottom: 5%;
}
.abitright-2 {
    margin-right: 8% !important;
    margin-left: 0%;
}
.center {
    margin-left: auto;
    margin-right: auto;
    width: 100%;
}
.icon {
    margin-top: 10%;
}
</style>