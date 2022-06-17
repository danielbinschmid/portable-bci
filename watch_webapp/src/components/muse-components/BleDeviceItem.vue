<template>
    <div id="ble-device-item">
        <v-list-item>
            <v-list-item-icon class="abitright">
                <div v-if="pairing">
                    <half-circle-spinner
                        :animation-duration="1000"
                        :size="layout_data.MAX_WIDTH / 14"
                        :color="layout_data.GREEN"
                    />
                </div>
                <div v-else>
                    <v-icon :color="layout_data.GREEN" :size="MAX_WIDTH / 14">{{
                        paired ? "mdi-bluetooth-connect" : "mdi-all-inclusive"
                    }}</v-icon>
                </div>
            </v-list-item-icon>

            <v-list-item-content>
                <div name="muse name" class="mdc-typography-styles-overline">
                    {{ devInfo.name }}
                </div>
            </v-list-item-content>
        </v-list-item>
        <div v-for="(log, index) in logs" :key="index">
            {{ log }}
        </div>
    </div>
</template>

<script>
import { HalfCircleSpinner } from "epic-spinners/dist/lib/epic-spinners.min.js";
import { LAYOUT_DATA } from "@/data/layout_constraints";
export default {
    name: "BleDeviceItem",
    components: { HalfCircleSpinner },
    props: {
        devInfo: undefined,
        selected: Boolean,
    },
    data() {
        return {
            paired: false,
            pairing: false,
            layout_data: LAYOUT_DATA,
            logs: [],
        };
    },
    methods: {
        /**
         * Directly discovers the device after connecting to it
         */
        connectSuccessCallback(status, devInfo) {
            if (status.status == "connected") {
                var vm = this;
                // this.logs.push("discovering ..")
                window.bluetoothle.discover(
                    (status, devInfo) => {
                        vm.pairing = false;
                        vm.paired = true;
                    },
                    (err, error) => {
                        vm.logs.push(err);
                    },
                    { address: this.devInfo.address, clearCache: true }
                );
            } else {
                this.paired = false;
                this.pairing = false;
                // connection lost
            }
        },
        /**
         * @param {any} status
         * @param {any} err
         */
        connectErrorCallback(status, err) {
            console.log(status);
            this.pairing = false;
        },
        /**
         * Tries to pair with this device
         */
        startPairing() {
            window.bluetoothle.connect(
                this.connectSuccessCallback,
                this.connectErrorCallback,
                { address: this.devInfo.address }
            );
            this.pairing = true;
        },
        /**
         * Closes any connection with this device
         */
        close() {
            var vm = this;
            window.bluetoothle.close(
                (status, devInfo) => {
                    vm.pairing = false;
                    vm.paired = false;
                },
                (status, err) => {
                    this.pairing = false;
                },
                { address: this.devInfo.address }
            );
        },
    },
    watch: {
        selected() {
            if (this.selected) {
                if (!this.paired && !this.pairing) {
                    this.startPairing();
                }
            } else {
                if (this.paired || this.pairing) {
                    this.close();
                }
            }
        },
        paired() {
            this.$emit("paired", this.paired);
        },
    },
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