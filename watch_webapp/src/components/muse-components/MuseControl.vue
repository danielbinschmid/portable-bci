<template>
    <div id="muse-control">
        <small-card
            :icon="globalIcon"
            :isMenuOpened="isOpen"
            :popupName="'MUSE'"
            @openMenu="open()"
            topMargin
            isOpaque
            hideMenuIcon
            
        >
            <overlay-back-button @exit="exit()" :color="layout.ORANGE" />
            <small-card
                :icon="bleIcon"
                :isMenuOpened="isDeviceListInstantiated"
                :popupName="'BLE'"
                @openMenu="showDetectedDevices()"
                topMargin
            >
                <v-list style="padding: 0" color="rgba(0, 0, 0, 0)">
                    <overlay-back-button @exit="showDetectedDevices()" />
                    <loading-list-item
                        :icon="bleIcon"
                        :isLoading="scanStatus == ScanStatus.scanning"
                        :text="bleButtonText"
                        @press="bleButton()"
                    />
                    <v-list-item-group
                        :color="layout.GREEN"
                        v-model="selectedDevice"
                    >
                        <div v-for="(item, i) in detected_devices" :key="i">
                            <v-divider> </v-divider>
                            <ble-device-item
                                :devInfo="item"
                                :selected="selectedDevice == i"
                                @paired="devicePairedChange($event, i)"
                            />
                        </div>
                    </v-list-item-group>
                </v-list>
            </small-card>

            <muse-stream-control
                :connectedDevice="pairedDevice"
                @streamingChange="streamingChange"
                :streaming="isStreamingEnabled"
            />
            <div  :style="{color: 'rgba(0, 0, 0 ,0)' }"> _</div>
            
        </small-card>
        <div v-for="(log, index) in logs" :key="index">
            {{ log }}
        </div>
    </div>
</template>

<script>
import LoadingListItem from "@/components/ui-comps/LoadingListItem.vue";
import OverlayBackButton from "@/components/ui-comps/OverlayBackButton.vue";
import SmallCard from "@/components/ui-comps/SmallCard.vue";
import MuseStreamControl from "./MuseStreamControl.vue";
import {
    ScanStatus,
    BleConnectionStatus,
    BleDeviceStatus,
} from "@/data/enums.js";
import BleDeviceItem from "./BleDeviceItem.vue";
// import bluetoothle from "cordova-plugin-bluetoothle";
export default {
    name: "MuseControl",
    components: {
        LoadingListItem,
        MuseStreamControl,
        SmallCard,
        BleDeviceItem,
        OverlayBackButton,
    },
    data() {
        return {
            isOpen: false,
            isStreamingEnabled: false,
            layout: window.layout,
            isDeviceListInstantiated: false,
            connected: false,
            detected_devices: [],
            pairedDevice: undefined,
            BleConnectionStatus: BleConnectionStatus,
            ScanStatus: ScanStatus,
            BleDeviceStatus: BleDeviceStatus,
            bleConnectionStatus: BleConnectionStatus.notInitialized,
            scanStatus: ScanStatus.idle,
            selectedDevice: undefined,
            logs: [],
            museControlData: {},

        };
    },
    mounted() {
        this.initialize();
    },
    methods: {
        streamingChange(isStreaming) {
            this.isStreamingEnabled = isStreaming;
            this.$emit("streamingChange", isStreaming);
        },
        open() {
            this.isOpen = true;
        },
        exit() {
            this.museControlData.pairedDevice = this.pairedDevice;
            this.$emit("exit", this.museControlData);
            this.isOpen = false;
        },
        showDetectedDevices() {
            this.isDeviceListInstantiated = !this.isDeviceListInstantiated;
        },
        visualize() {
            this.$emit("visualize", this.pairedDevice);
        },
        back() {
            this.$emit("back");
        },
        scanSuccessCallback(status) {
            if (status.status === "scanStarted") {
                this.scanStatus = ScanStatus.scanning;
            }
            if (status.status === "scanResult") {
                if (
                    this.detected_devices.findIndex(
                        (x) => x.address === status.address
                    ) === -1 &&
                    status.name != null
                ) {
                    this.detected_devices.push(status);
                }
            }
        },
        startScan() {
            window.bluetoothle.startScan(this.scanSuccessCallback, (err) => {});
            this.scanStatus = ScanStatus.scanning;
        },
        stopScan() {
            var vm = this;
            window.bluetoothle.stopScan(
                (status) => {
                    vm.scanStatus = ScanStatus.idle;
                },
                (error) => {}
            );
        },
        initializationCallback(status) {
            switch (status.status) {
                case "enabled":
                    this.bleConnectionStatus = BleConnectionStatus.notConnected;
                    break;
                case "disabled":
                    this.bleConnectionStatus =
                        BleConnectionStatus.notInitialized;
                    break;
            }
        },
        initialize() {
            window.bluetoothle.initialize(this.initializationCallback);
        },
        bleButton() {
            if (
                this.bleConnectionStatus == BleConnectionStatus.notInitialized
            ) {
                this.initialize();
            } else {
                switch (this.scanStatus) {
                    case ScanStatus.idle:
                        this.startScan();
                        break;
                    case ScanStatus.scanning:
                        this.stopScan();
                        break;
                }
            }
        },
        /**
         * @param {Boolean} paired
         * @param {number} index
         */
        devicePairedChange(paired, index) {
            if (paired) {
                this.pairedDevice = this.detected_devices[index];
                this.bleConnectionStatus = BleConnectionStatus.connected;
            } else if (this.pairedDevice) {
                if (
                    this.pairedDevice.address ==
                    this.detected_devices[index].address
                ) {
                    this.pairedDevice = undefined;
                    this.bleConnectionStatus = BleConnectionStatus.notConnected;
                }
            }
        },
    },
    computed: {
        bleIcon() {
            switch (this.bleConnectionStatus) {
                case BleConnectionStatus.notConnected:
                    return "mdi-bluetooth";
                case BleConnectionStatus.connected:
                    return "mdi-bluetooth-connect";
                case BleConnectionStatus.notInitialized:
                    return "mdi-bluetooth-off";
                default:
                    return "Err";
            }
        },
        bleButtonText() {
            if (
                this.bleConnectionStatus == BleConnectionStatus.notInitialized
            ) {
                return "BLE init";
            }
            if (this.scanStatus == ScanStatus.scanning) {
                return "Stop scan";
            } else {
                return "BLE scan";
            }
        },
        globalIcon() {
            switch (this.bleConnectionStatus) {
                case BleConnectionStatus.notConnected:
                    return "mdi-bluetooth-off";
                case BleConnectionStatus.connected:
                    if (this.isStreamingEnabled) {
                        return "mdi-access-point-check";
                    } else {
                        return "mdi-bluetooth-connect";
                    }
                    
                case BleConnectionStatus.notInitialized:
                    return "mdi-bluetooth-off";
                default:
                    return "Err";
            }
        },
    },
};
</script>

<style>
</style>