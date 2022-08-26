export const ScanStatus = {
    idle: 1,
    scanning: 2
}

export const BleConnectionStatus = {
    notConnected: 1,
    connected: 2,
    notInitialized: 3
}

export const BleDeviceStatus = {
    unpaired: 1,
    paired: 2,
    pairing: 3
}

export const StreamingStatus = {
    ready: 1,
    streaming: 2,
    disabled: 3
}

export const MuseStreamingModes = {
    EEG: "EEG",
    PGB: "PGB",
    AUX: "AUX",
    RAND: "RAND",
    idle: 0
}