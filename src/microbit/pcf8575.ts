import { pins } from './core/pins';
/**
 * PCF8575
 */
//% weight=100 color=#0f00ff icon=""
namespace PCF8575 {
    const CHIP_ADDRESS = 0x20

    export enum PinValue {
        //% block="高1"
        H = 0x1,
        //% block="低0"
        L = 0x0
    }
    export enum PinIndex {
        P0 = 0x00,
        P1 = 0x01,
        P2 = 0x02,
        P3 = 0x03,
        P4 = 0x04,
        P5 = 0x05,
        P6 = 0x06,
        P7 = 0x07,

        P10 = 0x08,
        P11 = 0x09,
        P12 = 0x0a,
        P13 = 0x0b,
        P14 = 0x0c,
        P15 = 0x0d,
        P16 = 0x0e,
        P17 = 0x0f
    }
    /**
        * 设置针脚电位
        * 参数 针脚 pin
        * 参数 电位 value
        */
    //% pin.min=0 pin.max=256
    //% value.min=-9999 value.max=9999
    //% blockId=setPinValue block="设置针脚 %pin|的电位 %value"
    export function setPinValue(pin: PinIndex, value: PinValue): void {
        const currentState = getValue();
        // if (pin > 7) {
        //     pin = 15 - pin + 8;
        // } else {
        //     pin = 7 - pin;
        // }
        const bit = 1 << 15 - pin;
        const newState = value == 1 ? (currentState | bit) : (currentState & (~bit & 0xffff));
        setValue(newState);
    }
    /**
     * 读取针脚电位
     */
    //% blockId=readPinValue block="读取针脚 %u 的电位"
    export function getPinValue(pin: PinIndex): PinValue {
        const currentState = getValue();
        const value = currentState & 1 << 15 - pin;
        return value == 0 ? PinValue.L : PinValue.H;
    }
    /**
    * 复位
    */
    //% blockId=reset block="复位"
    export function reset(): void {
        setValue(0);
    }
    /**
     * 电位
     */
    //% blockId=pinValue block="电位 %u"
    export function pinValue(value: PinValue): PinValue {
        return value;
    }
    function setValue(value: number) {
        const buffer2 = pins.createBuffer(2);
        buffer2[0] = (value >> 8) & 0xff;
        buffer2[1] = value & 0xff;
        pins.i2cWriteBuffer(CHIP_ADDRESS, buffer2, false);
    }
    function getValue() {
        const buffer = pins.i2cReadBuffer(CHIP_ADDRESS, 2, false);
        return buffer[0] << 8 | buffer[1];
    }
}
export default {
    ... PCF8575
}