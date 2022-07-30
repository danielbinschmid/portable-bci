<template>
    <div id="record">
        <v-list style="padding: 0" color="rgba(0, 0, 0, 0)">
            <overlay-back-button @exit="exit()" bottomPadding />
            <v-divider />

            <div v-for="(item, i) in sessions" :key="i">
                <simple-button x_large @click="select(i)">
                    {{ item }}
                </simple-button>
            </div>
            <simple-button @click="addSession()" bottomPadding x_large>
                +
            </simple-button>

            <div v-for="(item, i) in sessions" :key="item + i">
                <v-dialog v-model="isSessionOpened[i]" fullscreen>
                    <v-card :color="'rgba(236, 239, 241, 0.95)'">
                        <session
                            @exit="exitSession(i)"
                            :isCurrentFinetuned="finetunedSession.idx == i"
                            @finetune="
                                changeFinetunedSession({
                                    name: item,
                                    idx: i,
                                })
                            "
                            @forgetFinetune="
                                changeFinetunedSession({
                                    name: 'default',
                                    idx: -1,
                                })
                            "
                        />
                    </v-card>
                </v-dialog>
            </div>
        </v-list>
    </div>
</template>



<script>
import OverlayBackButton from "@/components/ui-comps/OverlayBackButton.vue";
import SimpleButton from "@/components/ui-comps/SimpleButton.vue";
import IconListItem from "@/components/ui-comps/IconListItem.vue";
import Session from "./Session.vue";
import Vue from "vue";

export default {
    components: { OverlayBackButton, SimpleButton, IconListItem, Session },
    name: "Record",
    data() {
        const nSession = 3;

        return {
            isSessionOpened: [false, false, false],
            currentSession: -1,
            layout_data: window.layout,
            logs: [],
            sessions: ["DAY 1", "DAY 2", "DAY 3"],
        };
    },
    props: {
        finetunedSession: undefined,
    },
    methods: {
        exit() {
            this.$emit("exit");
        },
        addSession() {},
        select(idx) {
            Vue.set(this.isSessionOpened, idx, true);
        },
        exitSession(idx) {
            Vue.set(this.isSessionOpened, idx, false);
            // this.isSessionOpened[idx] = false;
        },
        changeFinetunedSession(session) {
            this.$emit("changeFinetunedSession", session);
        },
    },
};
</script>
