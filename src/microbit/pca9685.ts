import { pins,NumberFormat, PinPullMode, PulseValue } from './core/pins';
import { basic,control } from './core/basic';

/**
 * MicrobitV1.0 扩展板 电机、舵机、板载LED 驱动程序，基于PCA9685。
 */

enum Motors {
    //% block="M1"
    M1 = 0x1,
    //% block="M2"
    M2 = 0x2,
}

enum Servos {
    //% block="servo1"
    servo1 = 0x6,
    //% block="servo2"
    servo2 = 0x7,
    //% block="servo3"
    servo3 = 0x8,
    //% block="servo4"
    servo4 = 0x9,
    //% block="servo5"
    servo5 = 0xA,
}

enum Leds {
    //% block="led1"
    led1 = 0x1,
    //% block="led2"
    led2 = 0x2,
    //% block="led3"
    led3 = 0x3,
    //% block="led4"
    led4 = 0x4,
    //% block="led5"
    led5 = 0x5,
}

enum Dir {
    //% block="forward"
    forward = 0x1,
    //% block="backward"
    backward = 0x2,
    //% block="turnRight"
    turnRight = 0x3,
    //% block="turnLeft"
    turnLeft = 0x4,
    //% block="stop"
    stop = 0x5,
}

enum StopMODE {
    //% block="M1_Stop"
    M1_Stop = 0x1,
    //% block="M2_Stop"
    M2_Stop = 0x2,
    //% block="M_All"
    M_All   =  0x3,
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

    P8 = 0x08,
    P9 = 0x09,
    P10 = 0x0a,
    P11 = 0x0b,
    P12 = 0x0c,
    P13 = 0x0d,
    P14 = 0x0e,
    P15 = 0x0f
}

/**
 * PCA9685
 */
//% weight=5 color=#0fbc11 icon="\uf1b6"
namespace PCA9685 {
    let CHIP_ADDRESS = 0x40
    const chipResolution = 4096;

    const MODE1 = 0x00
    const MODE2 = 0x01
    const SUBADR1 = 0x02
    const SUBADR2 = 0x03
    const SUBADR3 = 0x04
    const PRESCALE = 0xFE
    const LED0_ON_L = 0x06
    const LED0_ON_H = 0x07
    const LED0_OFF_L = 0x08
    const LED0_OFF_H = 0x09
    const ALL_LED_ON_L = 0xFA
    const ALL_LED_ON_H = 0xFB
    const ALL_LED_OFF_L = 0xFC
    const ALL_LED_OFF_H = 0xFD

    const STP_CHA_L = 2047
    const STP_CHA_H = 4095

    const STP_CHB_L = 1
    const STP_CHB_H = 2047

    const STP_CHC_L = 1023
    const STP_CHC_H = 3071

    const STP_CHD_L = 3071
    const STP_CHD_H = 1023

    let initialized = false
    let last_value = 0; // assume initially that the line is left.
    let calibratedMax = [650, 650, 650, 650, 650];
    let calibratedMin = [100, 100, 100, 100, 100];

    
    export enum Servos {
        //% block="Servo 0"
        Servo0 = 0,
        //% block="Servo 1"
        Servo1 = 1,
        //% block="Servo 2"
        Servo2 = 2,
        //% block="Servo 3"
        Servo3 = 3,
        //% block="Servo 4"
        Servo4 = 4,
        //% block="Servo 5"
        Servo5 = 5,
        //% block="Servo 6"
        Servo6 = 6,
        //% block="Servo 7"
        Servo7 = 7,
        //% block="Servo 8"
        Servo8 = 8,
        //% block="Servo 9"
        Servo9 = 9,
        //% block="Servo 10"
        Servo10 = 10,
        //% block="Servo 11"
        Servo11 = 11,
        //% block="Servo 12"
        Servo12 = 12,
        //% block="Servo 13"
        Servo13 = 13,
        //% block="Servo 14"
        Servo14 = 14,
        //% block="Servo 15"
        Servo15 = 15
    }
    function i2cwrite(addr: number, reg: number, value: number,repeated?:boolean) {
        let buf = pins.createBuffer(2)
        buf[0] = reg
        buf[1] = value
        pins.i2cWriteBuffer(addr, buf)
    }

    function i2cread(addr: number, reg: number,repeated?:boolean) {
        pins.i2cWriteNumber(addr, reg, 1);
        let val = pins.i2cReadNumber(addr, NumberFormat.UInt8BE);
        return val;
    }

    function initPCA9685(): void {
        i2cwrite(CHIP_ADDRESS, MODE1, 0x00)
        setFreq(50);
        setPwm(0, 0, 4095);
        for (let idx = 1; idx < 16; idx++) {
            setPwm(idx, 0, 0);
        }
        initialized = true
    }

    function setFreq(freq: number): void {
        // Constrain the frequency
        let prescaleval = 25000000;
        prescaleval /= chipResolution;
        prescaleval /= freq;
        prescaleval -= 1;
        let prescale = prescaleval; //Math.Floor(prescaleval + 0.5);
        let oldmode = i2cread(CHIP_ADDRESS, MODE1);
        let newmode = (oldmode & 0x7F) | 0x10; // sleep
        i2cwrite(CHIP_ADDRESS, MODE1, newmode); // go to sleep
        i2cwrite(CHIP_ADDRESS, PRESCALE, prescale); // set the prescaler
        i2cwrite(CHIP_ADDRESS, MODE1, oldmode);
        // control.waitMicros(5000);    
        i2cwrite(CHIP_ADDRESS, MODE1, oldmode | 0xa1);
    }

    function setPwm(channel: number, on: number, off: number): void {
        if (channel < 0 || channel > 15)
            return;

        let buf = pins.createBuffer(5);
        buf[0] = LED0_ON_L + 4 * channel;
        buf[1] = on & 0xff;
        buf[2] = (on >> 8) & 0xff;
        buf[3] = off & 0xff;
        buf[4] = (off >> 8) & 0xff;
        pins.i2cWriteBuffer(CHIP_ADDRESS, buf);
    }
     
  /**
	 * 舵机控制
	 * 角度控制范围[0-180]; 例如: 90, 0, 180
	*/
    //% blockId=Servo block="setze Winkel von |%channel| auf |%degree=protractorPicker| °"
    //% weight=85
    //% channel.fieldEditor="gridpicker"
    //% channel.fieldOptions.width=220
    //% channel.fieldOptions.columns=4
    //% degree.min=0 degree.max=180
    export function Servo(channel: Servos, degree: number): void {
        if (!initialized) {
            initPCA9685();
        }
        // 50hz: 20,000 us
        let v_us = (degree * 1800 / 180 + 600); // 0.6 ~ 2.4
        let value = v_us * 4096 / 20000;
        setPwm(channel, 0, value);
    } 

	
    /**
	 * 舵机控制
	 * 脉冲控制范围[500-2500]; 例如: 1500, 500, 2500
	*/
    //% blockId=ServoPulse block="setze Puls von |%channel| auf |%pulse| μs"
    //% weight=85
    //% pulse.min=500 pulse.max=2500
    //% channel.fieldEditor="gridpicker"
    //% channel.fieldOptions.width=220
    //% channel.fieldOptions.columns=4
    export function ServoPulse(channel: Servos, pulse: number): void {
        if (!initialized) {
            initPCA9685();
        }
        // 50hz: 20,000 us
        let value = pulse * 4096 / 20000;
        setPwm(channel, 0, value);
    }

    //% blockId=SetI2cAdress block="setze I2C Adresse von 0x40 (default) auf 0x7F (Grove)"
    export function SetI2cAdress(): void {
        CHIP_ADDRESS = 0x7F
    }



     /**
	 * LED控制
	 * 板载LED控制，基于PCA9685扩展引脚
	*/
    //% block="Led|%index|light %light"  group="LED灯"
    //% light eg: 0
    //% light.min=0 light.max=1023
    export function LedRun(index: number, light: number):void {
        if (!initialized) {
            initPCA9685()
        }
        light = light * 4; // map 255 to 4096
        if (light >= 4096) {
            light = 4095
        }
        if (light <=0) {
            light = 0
        }
        if (index == 1){
            setPwm(11,0,light)
        }else if (index == 2){
            setPwm(12,0,light)
        }else if (index == 3){   
            setPwm(13,0,light)
        }else if (index == 4){    
            setPwm(14,0,light)
        }else if (index == 5){    
            setPwm(15,0,light)
        } 
    }



    /**
	 * 单个电机控制
	 * 电机速度设置范围[-100 - 100]; 例如: 50
	*/

    //% block="Motor|%index|speed %speed"  group="小车控制"
    //% speed eg: 50
    //% speed.min=-100 speed.max=100
    export function MotorRun(index: Motors, speed: number): void {
        if (!initialized) {
            initPCA9685()
        }
        speed = speed * 41; // map 255 to 4096
        if (speed >= 4096) {
            speed = 4095
        }
        if (speed <= -4096) {
            speed = -4095
        }
        if (index == 1) {
            if (speed >= 0) {
                setPwm(1, 0, 4095)
                setPwm(2, 0, 0)
                setPwm(0, 0, speed)
            } else {
                setPwm(1, 0, 0)
                setPwm(2, 0, 4095)
                setPwm(0, 0, -speed)
            }
        } else if (index == 2) {
            if (speed >= 0) {
                setPwm(4, 0, 4095)
                setPwm(3, 0, 0)
                setPwm(5, 0, speed)
            } else {
                setPwm(4, 0, 0)
                setPwm(3, 0, 4095)
                setPwm(5, 0, -speed)
            }
        }
    }
	/**
	 * 两个电机同步控制
	 * 电机速度设置范围[-100 - 100]; 例如: 50
	*/
    //% block="Motor |%index|speed %speed" group="小车控制"
    //% speed eg: 50
    //% speed.min=-100 speed.max=100 eg: 0
    export function Run(index: Dir, speed: number): void {
        switch (index) {
            case Dir.forward:
                MotorRun(Motors.M1, speed);
                MotorRun(Motors.M2, speed);
                break;
            case Dir.backward:
                MotorRun(Motors.M1, -speed);
                MotorRun(Motors.M2, -speed);
                break;
            case Dir.turnRight:
                MotorRun(Motors.M1, speed);
                MotorRun(Motors.M2, -speed);
                break;
            case Dir.turnLeft:
                MotorRun(Motors.M1, -speed);
                MotorRun(Motors.M2, speed);
                break;
            case Dir.stop:
                MotorRun(Motors.M1, 0);
                MotorRun(Motors.M2, 0);
                break;
        }
    }

    /**
	 * 两个电机同时控制，电机停止
	*/
    //% block="Motor |%mode| stop" group="小车控制"
    export function RunStop(mode: StopMODE): void{
        switch (mode) {
            case StopMODE.M1_Stop:
                MotorRun(Motors.M1, 0);
                break;
            case StopMODE.M2_Stop:
                MotorRun(Motors.M2, 0);
                break;
            case StopMODE.M_All:
                MotorRun(Motors.M1, 0);
                MotorRun(Motors.M2, 0);
                break;
        }
        
    }

	/**
	 * 两个电机同时控制
	 * 电机速度设置范围[-100 - 100]; 例如: 50
	 * 延时秒数; 例如: 2秒
	*/
    //% block="Motor |%index|speed %speed|for %time|sec" group="小车控制"
    //% speed eg: 50
    //% speed.min=-100 speed.max=100 eg: 0
    export function RunDelay(index: Dir, speed: number, time: number): void {
        Run(index, speed);
        basic.pause(time * 1000);
        Run(Dir.stop, 0);
    }

    /**
	 * 超声波距离检测，单位cm
	*/
    //% block="ping |trig %trig |echo %echo" group="超声波"
    export function Ultrasonic(trig: PinIndex, echo: PinIndex): number {

        // send pulse
        pins.setPull(trig, PinPullMode.PullNone);
        pins.digitalWritePin(trig, 0);
        control.waitMicros(2);
        pins.digitalWritePin(trig, 1);
        control.waitMicros(10);
        pins.digitalWritePin(trig, 0);

        // read pulse
        let d = pins.pulseIn(echo, PulseValue.High, 11600);
        return d / 58;
    }

    /**
	 * 循迹数值读取，基于TLC1543引脚扩展芯片，返回A0-A4五个通道的模拟量
	*/
    //% block="AnalogRead" group="巡线"
    export function AnalogRead(): number[] {
        if (!initialized) {
            initPCA9685()
        }
        let i = 0;
        let j = 0;
        let channel = 0;
        let values = [0, 0, 0, 0, 0, 0];
        let sensor_values = [0, 0, 0, 0, 0];
        //pins.digitalWritePin(DigitalPin.P16, 0);
        setPwm(0, 0, 0);
        basic.pause(2);
        for (i = 0; i < 6; i++) {
            for (j = 0; j < 10; j++) {
                //0 to 4 clock transfer channel address
                if (j < 4) {
                    if ((i >> (3 - j)) & 0x01) {
                        pins.digitalWritePin(115, 1);
                    } else {
                        pins.digitalWritePin(115, 0);
                    }
                }
                //0 to 10 clock receives the previous conversion result
                values[i] <<= 1;
                if (pins.digitalReadPin(114)) {
                    values[i] |= 0x01;
                }
                pins.digitalWritePin(113, 1);
                pins.digitalWritePin(113, 0);
            }
        }
        //pins.digitalWritePin(DigitalPin.P16, 1);
        setPwm(0, 0, 4095);
        for (i = 0; i < 5; i++) {
            sensor_values[i] = values[i + 1];
        }
        return sensor_values;
    }

    /**
	 * 循迹传感器校准
	*/
    //% block="SensorCalibrated" group="巡线"
    export function SensorCalibrated(): void {
        let i = 0;
        let j = 0;
        let k = 0;
        let max_sensor_values = [0, 0, 0, 0, 0];
        let min_sensor_values = [0, 0, 0, 0, 0];

        for (let i = 0; i < 5; i++)  // make the calibration take about 10 seconds
        {
            calibratedMax[i] = 0;
            calibratedMin[i] = 1023;
        }


        for (let i = 0; i < 100; i++)  // make the calibration take about 10 seconds
        {
            if (i < 25 || i >= 75) {
                Run(Dir.turnLeft, 100)
            }
            else {
                Run(Dir.turnRight, 100)
            }

            // reads all sensors 100 times
            for (j = 0; j < 5; j++) {
                let sensor_values = AnalogRead();
                for (k = 0; k < 5; k++) {
                    // set the max we found THIS time
                    if ((j == 0) || (max_sensor_values[k] < sensor_values[k]))
                        max_sensor_values[k] = sensor_values[k];

                    // set the min we found THIS time
                    if ((j == 0) || (min_sensor_values[k] > sensor_values[k]))
                        min_sensor_values[k] = sensor_values[k];
                }
            }

            // record the min and max calibration value
            for (k = 0; k < 5; k++) {
                if (min_sensor_values[k] > calibratedMax[k])
                    calibratedMax[k] = min_sensor_values[k];
                if (max_sensor_values[k] < calibratedMin[k])
                    calibratedMin[k] = max_sensor_values[k];
            }
        }

        Run(Dir.stop, 0);
    }

    /**
	 * 循迹最大值
	*/
    //% block="ReadSensorMax" group="巡线"
    export function ReadSensorMax(): number[] {
        return calibratedMax;
    }

    /**
	 * 循迹最小值
	*/
    //% block="ReadSensorMin" group="巡线"
    export function ReadSensorMin(): number[] {
        return calibratedMin;
    }

    /**
	 * 循迹校准数值
     * 返回的校准值为0-1000的数值，0 对应校准后的最小值，1000 对应最大值。
     * 为每个通道的光电传感器存储校准后的值，方便自动计算传感器存在的差异。
	*/
    //% block="ReadCalibrated" group="巡线"
    export function readCalibrated(): number[] {
        // read the needed values
        let sensor_values = AnalogRead();

        for (let i = 0; i < 5; i++) {
            let denominator = calibratedMax[i] - calibratedMin[i];
            let x = ((sensor_values[i] - calibratedMin[i]) * 1000 / denominator);
            if (x < 0)
                x = 0;
            else if (x > 1000)
                x = 1000;
            sensor_values[i] = x;
        }
        return sensor_values;
    }

    /**
	 * 获取线位置
	*/
    //% block="ReadLine" group="巡线"
    export function readLine(): number {

        let i = 0;
        let on_line = 0;
        let avg = 0; // this is for the weighted total, which is long
        // before division
        let sum = 0; // this is for the denominator which is <= 64000
        let white_line = 0;

        // readCalibrated(sensor_values);
        let sensor_values = readCalibrated();

        for (i = 0; i < 5; i++) {
            let value = sensor_values[i];

            if (!white_line)
                value = 1000 - value;
            sensor_values[i] = value;
            // keep track of whether we see the line at all
            if (value > 200) {
                on_line = 1;
            }

            // only average in values that are above a noise threshold
            if (value > 50) {
                avg += (value) * (i * 1000);
                sum += value;
            }
        }

        if (!on_line) {
            // If it last read to the left of center, return 0.
            if (last_value < (4) * 1000 / 2)
                return 0;
            // If it last read to the right of center, return the max.
            else
                return 4 * 1000;
        }

        last_value = avg / sum;

        return last_value;
    }
    
    
}
export default {
    ... PCA9685
}