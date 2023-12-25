import pcf from './pcf8575';

pcf.setPinValue(pcf.PinIndex.P1, 1);
console.log(pcf.getPinValue(pcf.PinIndex.P3));
pcf.setPinValue(pcf.PinIndex.P0, 1);
console.log(pcf.getPinValue(pcf.PinIndex.P0));
console.log(pcf.getPinValue(pcf.PinIndex.P1));
//pcf.reset()


