import * as fs from 'fs';
export namespace pins {
    export const setPull=(trig: DigitalPin,pullMode: PinPullMode.PullNone)=>{

    }
    export const createBuffer = (size: number): Uint8Array => {
        const buffer = new Uint8Array(size);
        return buffer;
    }
    export const i2cWriteBuffer = (addr: number, buffer: Uint8Array, repeated?: boolean) => {
        let content = '';
        console.log('写入:', buffer);
        for (let i = 0; i < buffer.length; i++) {
            if (i != 0) {
                content += ' ';
            }
            content += buffer[i].toString(2).padStart(8, '0');
        }
        fs.writeFileSync('./db.txt', content, 'utf-8');
        console.log('写入成功:' + content);
    }

    export function i2cReadBuffer(addr: number, size: number, repeated?: boolean): Uint8Array {
        let content = fs.readFileSync('./db.txt', 'utf-8');
        console.log('读取到:' + content);
        const buffer = new Uint8Array(size);
        const array = content.split(' ');
        for (let i = 0; i < size; i++) {
            buffer[i] = parseInt(array[i]);
        }
        console.log('读取成功:', buffer);
        return buffer;
    }
    export function i2cWriteNumber(addr: number, value: number, format: NumberFormat, repeated?: boolean) {
        let buf = createBuffer(1)
        buf[0] = value;
        i2cWriteBuffer(addr, buf, repeated)
    }
    export function i2cReadNumber(addr: number, format: NumberFormat, repeated?: boolean) {
        const arr = i2cReadBuffer(addr, 1, repeated);
        return arr[0];
    }
}


export declare const enum NumberFormat {
    Int8LE = 1,
    UInt8LE = 2,
    Int16LE = 3,
    UInt16LE = 4,
    Int32LE = 5,
    Int8BE = 6,
    UInt8BE = 7,
    Int16BE = 8,
    UInt16BE = 9,
    Int32BE = 10,

    UInt32LE = 11,
    UInt32BE = 12,
    Float32LE = 13,
    Float64LE = 14,
    Float32BE = 15,
    Float64BE = 16,
}