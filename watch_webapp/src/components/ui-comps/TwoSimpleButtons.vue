<template>
    <div id="two-simple-buttons">
        <v-list-item
            :style="{
                paddingTop: layout.SMALL_PADDING_TOP,
                paddingBottom: bottomPadding ? layout.SMALL_PADDING_TOP : '0px',
            }"
        >
            <v-list-item-content>
                <v-btn
                    class="center"
                    :color="getColor"
                    text
                    rounded
                    outlined
                    :disabled="disabled"
                    :x-large="isXLarge"
                    :large="large"
                    @click="exit()"
                >   
                    <div v-if="leftIsIcon">
                        <v-icon>
                            {{ leftVal }}
                        </v-icon>
                    </div>
                    <div v-else>
                        {{ leftVal }}
                    </div>
                    
                </v-btn>
            </v-list-item-content>
            <v-list-item-content>
                <v-btn
                    class="center"
                    :color="getColor"
                    text
                    rounded
                    outlined
                    :disabled="disabled"
                    :x-large="isXLarge"
                    :large="large"
                    @click="exit()"
                >
                    <div v-if="rightIsIcon">
                        <v-icon>
                            {{ rightVal }}
                        </v-icon>
                    </div>
                    <div v-else>
                        {{ rightVal }}
                    </div>
                </v-btn>
            </v-list-item-content>
        </v-list-item>
    </div>
</template>

<script>
export default {
    name: "TwoSimpleButtons",
    props: {
        color: String,
        bottomPadding: Boolean,
        x_large: Boolean,
        large: Boolean,
        disabled: Boolean,
        leftVal: String,
        leftIsIcon: Boolean,
        rightVal: String,
        rightIsIcon: Boolean,
    },
    data() {
        return {
            layout: window.layout,
        };
    },
    methods: {
        exit() {
            this.$emit("click");
        },
    },
    computed: {
        isXLarge() {
            console.log(this.x_large);
            if (!this.x_large && !this.large) {
                return true;
            } else {
                return this.x_large;
            }
        },
        getColor() {
            if (!this.color) {
                return window.layout.GREEN;
            } else {
                return this.color;
            }
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