import express = require("express");
import bodyParser = require('body-parser');
import {NetPorts, iCmd} from "./netports/netports";
import ComPort from "./netports/comport"

console.log('serial port service start')

const settings = {
    port:'COM3',//название порта
        settings: { // настройки порта
              baudRate: 115200, // this is synced to what was set for the Arduino Code
              dataBits: 8, // this is the default for Arduino serial communication
              parity: 'none', // this is the default for Arduino serial communication
              stopBits: 1, // this is the default for Arduino serial communication
              flowControl: false // this is the default for Arduino serial communication
          }
    }

let COMx: NetPorts = new ComPort(settings);

const app = express();
const jsonParser = bodyParser.json()

app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

function isComPortOpen (com: NetPorts): void{
    if (!com.isOpen) throw new Error('com is not open')
}

function getValidCmd (cmd: any): iCmd {
    let result: iCmd = {cmd: [], timeOut: 1000, wait: true};
    if (!cmd.cmd)
        throw new Error ('cmd field is missing');
    if (cmd.cmd.length == 0 )
        throw new Error ('cmd field is empty');
    result.cmd = cmd.cmd;
    result.timeOut = cmd.timeOut || 1000;
    //валидация boolean с присвоением false а по умолчанию true
    //без этой конструкции всегда присваивался true
    result.wait = (typeof cmd.wait !== 'undefined') ? cmd.wait : true ;
    return result;
}

app.put('/v1/data/', jsonParser, (request, response) =>{
    console.log(`/v1/data/PUT> ${request.body.cmd || ''}`);
    (async ()=>{
        try {
            isComPortOpen(COMx);
            const command: iCmd = getValidCmd(request.body);
            const start = new Date().getTime();
            const msg = await COMx.write(command);
            const stop = new Date().getTime(); 
            response.json( {'status':'OK',
                            'duration':(stop-start),
                            'time': new Date().toISOString(),
                            'msg':msg})
        } catch (e) {
            response.status(400).json({'Status':'Error',
                                        'Msg': e.message || ''})
        };
    })();
})

app.listen(5000)