<template>
    <div id="small-card">
        <v-card
            class="center"
            :max-width="layout_data.MAX_WIDTH"
            shaped
            :color="layout_data.ORANGE"
            :style="{ marginTop: topMargin ? layout_data.MARGIN_TOP : '0px' }"
        >
            <v-list-item>
                <v-list-item-icon class="abitright-2">
                    <div>
                        <v-icon
                            :color="layout_data.PLAIN_WHITE"
                            class="icon"
                            :size="layout_data.MAX_WIDTH / 10"
                        >
                            {{ icon }}
                        </v-icon>
                    </div>
                </v-list-item-icon>
                <v-list-item-content>
                    <v-btn
                        class="center"
                        :color="layout_data.PLAIN_WHITE"
                        text
                        rounded
                        outlined
                        x-large
                        @click="openMenu()"
                    >
                        <v-icon class="abitright-2"> mdi-menu-open </v-icon>
                        {{ popupName }}
                    </v-btn>
                </v-list-item-content>
            </v-list-item>
            <v-dialog v-model="isMenuOpened" fullscreen>
                <v-card color="rgba(236, 239, 241, 0.8)">
                    <slot></slot>
                </v-card>
            </v-dialog>
        </v-card>
    </div>
</template>

<script>
import { LAYOUT_DATA } from "@/data/layout_constraints";
export default {
    name: "SmallCard",
    data() {
        return {
            layout_data: LAYOUT_DATA,
        };
    },
    props: {
        icon: String,
        popupName: String,
        isMenuOpened: Boolean,
        topMargin: Boolean,
    },
    methods: {
        openMenu() {
            this.$emit("openMenu");
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

.icon {
    margin-top: 10%;
}

.abitright-2 {
    margin-right: 8% !important;
    margin-left: 0%;
}
</style>