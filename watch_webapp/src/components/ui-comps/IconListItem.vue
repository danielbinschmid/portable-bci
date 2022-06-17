<template>
    <div id="icon-list-item">
        <v-list-item>
            <v-list-item-icon class="abitright">
                <v-icon :color="layout_data.GREEN">mdi-all-inclusive</v-icon>
            </v-list-item-icon>

            <v-list-item-content>
                <div name="muse name" class="mdc-typography-styles-overline">
                    {{ item }}
                </div>
            </v-list-item-content>
        </v-list-item>
    </div>
</template>

<script>
import { LAYOUT_DATA } from "@/data/layout_constraints"
export default {
    name: "IconListItem",
    props: {
        item: String
    },
    data() {
        return {
            layout_data: LAYOUT_DATA
        }
    }
};
</script>

<style scoped>
.abitright {
    margin-right: 2% !important;
    margin-left: 2%;
}

.mdc-typography-styles-overline {
    font-family: unquote("Roboto");
    font-size: 10;
    letter-spacing: 1.25px;
}
</style>