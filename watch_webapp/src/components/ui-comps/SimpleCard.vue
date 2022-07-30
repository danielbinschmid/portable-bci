<template>
    <div id="simple-card">
        <v-card
            class="center"
            :max-width="layout_data.MAX_WIDTH"
            shaped
            :color="colorCard" 
            :style="{ marginTop: topMargin ? layout_data.MARGIN_TOP : '0px',
                      marginBottom:  bottomMargin ? layout_data.MARGIN_TOP : '0px'  }"
        >
            <v-list-item>
                <v-list-item-content>
                    <v-btn
                        class="center"
                        :color="colorText"
                        text
                        rounded
                        outlined
                        x-large
                        @click="openMenu()"
                    >
                        {{ popupName }}
                    </v-btn>
                </v-list-item-content>
            </v-list-item>
            <v-dialog v-model="isMenuOpened" fullscreen>
                <v-card :color="'rgba(236, 239, 241,'+ transparentness +')'">
                    <slot></slot>
                </v-card>
            </v-dialog>
        </v-card>
    </div>
</template>

<script>
import { LAYOUT_DATA } from "@/data/layout_constraints";
export default {
    name: "SimpleCard",
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
        bottomMargin: Boolean,
        colorCard: String,
        colorText: String,
        isOpaque: Boolean
    },
    methods: {
        openMenu() {
            this.$emit("openMenu");
        },
    },
    computed: {
        transparentness() {
            if (this.isOpaque) {
                return 1
            } else {
                return 0.8
            }
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