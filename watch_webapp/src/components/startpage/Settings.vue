<template>
    <div id="settings">
        <overlay-back-button @exit="exit()" />
        <v-list-item>
            <v-divider />
            <div
                class="mdc-typography-styles-overline"
                :style="{
                    color: layout.GREEN,
                }"
            >
                SETTINGS
            </div>
            <v-divider />
        </v-list-item>

        <div v-for="(item, i) in labels" :key="i">
            <simple-button @click="editLabel(i)"> {{ item }} </simple-button>
        </div>

        <simple-button @click="addLabel()" bottomPadding> + </simple-button>

        <div v-for="(item, i) in labels" :key="item + i">
            <v-dialog v-model="labelDialogs[i]" fullscreen>
                <v-card :color="'rgba(236, 239, 241, 0.95)'">
                    <overlay-back-button @exit="closeEditLabel(i)" />
                    <v-list-item>
                        <v-list-item-icon class="abitright-2">
                            <v-icon class="icon"> mdi-trash-can </v-icon>
                        </v-list-item-icon>
                        <v-list-item-content>
                            <v-btn
                                class="center"
                                :color="layout.ORANGE"
                                text
                                rounded
                                outlined
                                large
                                @click="deleteLabel()"
                            >
                                DELETE
                            </v-btn>
                        </v-list-item-content>
                    </v-list-item>
                </v-card>
            </v-dialog>
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import OverlayBackButton from "@/components/ui-comps/OverlayBackButton.vue";
import SimpleButton from "@/components/ui-comps/SimpleButton.vue";

export default {
    components: { OverlayBackButton, SimpleButton },
    name: "Settings",
    data() {
        return {
            layout: window.layout,
            labels: ["FEET", "RIGHT HAND", "LEFT HAND"],
            labelDialogs: [false, false, false],
        };
    },
    props: {},
    methods: {
        exit() {
            this.$emit("exit");
        },
        editLabel(labelIdx) {
            Vue.set(this.labelDialogs, labelIdx, true);
        },
        closeEditLabel(labelIdx) {
            Vue.set(this.labelDialogs, labelIdx, false);
        },
        deleteLabel(labelIdx) {},
        addLabel(labelIdx) {},
    },
};
</script>

<style scoped>
.mdc-typography-styles-overline {
    font-family: unquote("Roboto");
    font-size: 10;
    letter-spacing: 1.25px;
}
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