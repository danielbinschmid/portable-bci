<template>
    <div id="record-new">
        <overlay-back-button @exit="exit()" />
        <div v-if="state == 'idle'">
            <simple-button @click="start()"> GO </simple-button>
        </div>
        <div v-else-if="state == 'prepare' || state == 'trial'">
            <v-progress-circular
                class="topcenter"
                :rotate="180"
                :size="100"
                :width="15"
                :value="value"
                :color="state =='prepare' ? 'orange' : 'pink'"
            >
                {{ (value * 6.5) / 100 + "s" }}
            </v-progress-circular>
            <div
                name="muse name"
                class="mdc-typography-styles-overline"
                :style="{ color: layout_data.GREY }"
            >
                {{ state == 'prepare' ? 'PREPARE' : 'IMAGINE' }}
            </div>
        </div>

        <div v-else-if="state == 'choose'">
            <div v-for="(item, i) in labels" :key="i">
                <simple-button @click="selectLabel(i)">
                    {{ item }}
                </simple-button>

            </div>
            <simple-button @click="discard()" bottomPadding> DISCARD </simple-button>
        </div>
    </div>
</template>



<script>
import SimpleButton from "@/components/ui-comps/SimpleButton.vue";
import OverlayBackButton from "@/components/ui-comps/OverlayBackButton.vue";
import { LAYOUT_DATA } from "@/data/layout_constraints"
export default {
    components: { OverlayBackButton, SimpleButton },
    name: "RecordNew",
    data() {
        console.log(window.layout)
        return {
            layout_data: LAYOUT_DATA,
            labels: ["FEET", "RIGHT HAND", "LEFT HAND"],
            interval: {},
            state: "idle",
            value: 0,
            logs: [],
        };
    },
    methods: {
        exit() {
            this.$emit("exit");
        },
        start() {
            this.state = "prepare";
            this.interval = setInterval(() => {
                if (this.value == 25) {
                    clearInterval(this.interval);
                    this.state = "trial";
                    this.interval = setInterval(() => {
                        if (this.value == 100) {
                            this.value = 0;
                            this.state = "choose";
                            clearInterval(this.interval);
                        } else {
                            this.value += 12.5;
                        }
                    }, 800);
                } else {
                    this.value += 5;
                }
            }, 400);
        },
        discard() {
            this.state = "idle";
        },
        selectLabel(labelIdx) {
            this.$emit("newTrial", labelIdx);
            this.state = "idle";
        },
    },
};
</script>


<style scoped>
.texttop {
    font-family: unquote("Roboto");
    font-size: 10;
    letter-spacing: 1.25px;
    margin-top: 10%;
    margin-bottom: 10%;
}
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

.topcenter {
    margin-top: 10%;
    margin-left: auto;
    margin-right: auto;
    width: 100%;
}
</style>