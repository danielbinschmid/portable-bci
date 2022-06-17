<template>
    <div id="two-button-card">
        <v-card
            class="center"
            :max-width="layout_data.MAX_WIDTH"
            shaped
            :color="layout_data.ORANGE"
            :style="isTopElement ? { } : cardStyleObject "
        >
            <v-list-item>
                <v-list-item-content style="margin-right: 3%">
                    <v-btn
                        class="center"
                        color="#F2F2F2"
                        text
                        rounded
                        outlined
                        large
                        @click="b1()"
                    >
                        {{ b1Name }}
                    </v-btn>
                </v-list-item-content>
                <v-list-item-content>
                    <v-btn
                        class="center"
                        color="#F2F2F2"
                        text
                        rounded
                        outlined
                        large
                        @click="b2()"
                    >
                        {{ b2Name }}
                    </v-btn>
                </v-list-item-content>
            </v-list-item>
        </v-card>
    </div>
</template>

<script>
import { LAYOUT_DATA } from "@/data/layout_constraints";
export default {
    name: "TwoButtonCard",
    data() {
        return {
            cardStyleObject: {
                marginTop: LAYOUT_DATA.MARGIN_TOP,
            },
            layout_data: LAYOUT_DATA
        };
    },
    props: {
        b1Name: String,
        b2Name: String,
        isTopElement: Boolean
    },
    methods: {
        b1() {
            this.$emit("b1");
        },
        b2() {
            this.$emit("b2");
        },
    },
};
</script>

<style scoped>
.center {
    margin-left: auto;
    margin-right: auto;
    width: 100%;
}
</style>