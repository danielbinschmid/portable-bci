<template>
    <div id="record">
        <v-list style="padding: 0" color="rgba(0, 0, 0, 0)">
            <overlay-back-button @exit="exit()" bottomPadding withText>
                RECORD
            </overlay-back-button>
            <div
                class="mdc-typography-styles-overline"
                :style="{ color: layout_data.GREY }"
            >
                SESSIONS:
            </div>
            <div v-for="(item, i) in sessions" :key="i">
                <simple-button x_large @click="select(i)">
                    {{ item.name }}
                </simple-button>
            </div>
            <simple-button @click="addSession()" bottomPadding x_large>
                +
            </simple-button>
            <bottom-padding />
            <div v-for="(item, i) in sessions" :key="'_' + i">
                <v-dialog v-model="item.isOpened" fullscreen>
                    <v-card :color="'rgba(236, 239, 241, 0.95)'">
                        <session
                            :name="item.name"
                            @exit="exitSession(i)"
                             :isStreamingEnabled="isStreamingEnabled"
                            :museDevInfo="museDevInfo"
                            :isCurrentFinetuned="finetunedSession.idx == i"
                            :database="item.database"
                            @finetune="
                                changeFinetunedSession({
                                    name: item.name,
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
import BottomPadding from "@/components/ui-comps/BottomPadding.vue";
import OverlayBackButton from "@/components/ui-comps/OverlayBackButton.vue";
import SimpleButton from "@/components/ui-comps/SimpleButton.vue";
import IconListItem from "@/components/ui-comps/IconListItem.vue";
import Session from "./Session.vue";
import Vue from "vue";
import { Database } from "@/tools/database/Database";

export default {
    components: {
        OverlayBackButton,
        SimpleButton,
        IconListItem,
        Session,
        BottomPadding,
    },
    name: "Record",
    data() {
        const nSession = 3;

        return {
            currentSession: -1,
            layout_data: window.layout,
            logs: [],
            sessions: [
                {
                    name: "SESSION -1",
                    isOpened: false,
                },
            ],
        };
    },
    props: {
        finetunedSession: undefined,
        museDevInfo: undefined,
        isStreamingEnabled: Boolean
    },
    mounted() {
        const vm = this;
        window.globDatabase = new Database("bciMI", () => {
            vm.updateSessions(vm);
        });
    },
    methods: {
        exit() {
            this.$emit("exit");
        },
        updateSessions(vm) {
            const ids = window.globDatabase.getIDs();
            console.log(ids)
            var sessionIdx = 1;
            const sessions = [];
            for (const id of ids) {
                sessions.push({
                    isOpened: false,
                    name: "DAY " + sessionIdx,
                    database: window.globDatabase.getEntryDatabase(id),
                });
                sessionIdx += 1;
            }
            vm.sessions = sessions;
        },
        addSession() {
            /** @type {Database} */
            const globDatabase = window.globDatabase;
            const vm = this;
            globDatabase.createEntry(() => {
                vm.updateSessions(vm);
            });
        },
        select(idx) {
            const entry = this.sessions[idx];
            entry.isOpened = true;
            Vue.set(this.sessions, idx, entry);
        },
        exitSession(idx) {
            const entry = this.sessions[idx];
            entry.isOpened = false;
            Vue.set(this.sessions, idx, entry);
            this.updateSessions(this);
            // this.isSessionOpened[idx] = false;
        },
        changeFinetunedSession(session) {
            this.$emit("changeFinetunedSession", session);
        },
    },
};
</script>
