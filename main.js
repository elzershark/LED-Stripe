'use strict';
var utils =    require(__dirname + '/lib/utils'); // Get common adapter utils
var adapter = new utils.Adapter('mclighting');
const WebSocket = require('ws');
var ws;

adapter.on('unload', function (callback) {
    try {
        adapter.log.info('cleaned everything up...');
        callback();
    } catch (e) {
        callback();
    }
});

adapter.on('objectChange', function (id, obj) {
    adapter.log.info('objectChange ' + id + ' ' + JSON.stringify(obj));
});

// is called if a subscribed state changes
adapter.on('stateChange', function (id, state) {
    if (state && !state.ack){
        adapter.log.debug('stateChange ' + id + ' ' + JSON.stringify(state));
        var ids = id.split(".");
        var name = ids[ids.length - 2].toString();
        var command = ids[ids.length - 1].toString();
        var val = state.val;
        if (command == 'mode'){
            send('=' + val);
        }
        if (command == 'ws2812fx_mode'){
            send('/' + val);
        }
        if (command == 'color'){
            var c = val.split(",");
            send('#' + rgbToHex(parseInt(c[0]), parseInt(c[1]), parseInt(c[2])));
        }
        if (command == 'color_RGB'){
            send('#' + val);
        }
        if (command == 'set_all_RGB'){
            send('*#' + val);
        }
        if (command == 'single_RGB'){
            send('!' + val);
        }
        if (command == 'array_RGB'){
            send('+' + val);
        }
        if (command == 'rang_RGB'){
            send('R' + val);
        }
        if (command == 'speed'){
            if(val > 255) val = 255;
            if(val < 0) val = 0;
            send('?' + val);
        }
        if (command == 'brightness'){
            if(val > 255) val = 255;
            if(val < 0) val = 0;
            send('%' + val);
        }

        send('$');
    }

});

adapter.on('message', function (obj) {
    if (typeof obj === 'object' && obj.message) {
        if (obj.command === 'send') {
            // e.g. send email or pushover or whatever
            console.log('send command');
            // Send response in callback if required
            if (obj.callback) adapter.sendTo(obj.from, obj.command, 'Message received', obj.callback);
        }
    }
});

adapter.on('ready', function () {
    main();
});

var connect = function (){
    var host = adapter.config.host ? adapter.config.host : '127.0.0.1';
    var port = adapter.config.port ? adapter.config.port : 81;
    adapter.log.info('McLighting connect to: ' + host + ':' + port);
    ws = new WebSocket('ws://' + host + ':' + port);
    ws.on('open', function open() {
        send('something');
        send('$');
        setTimeout(function (){
            send('~');
        }, 10000);
    });

    ws.on('message', function incoming(data) {
        adapter.log.debug('message - ' + data);
        if(data === 'Connected'){
            adapter.setState('info.connection', true, true);
        }
        parse(data);
    });

    ws.on('error', function incoming(data) {
        adapter.log.debug('Error WS - ' + data);
    });
    ws.on('close', function incoming(data) {
        adapter.log.debug('CLOSE WS - ' + data);
        adapter.setState('info.connection', false, true);
        setTimeout(connect, 10000);
    });
};

function main() {
    adapter.subscribeStates('*');
    connect();
}

function send(data){
    ws.send(data, function ack(error) {
        if(error){
            adapter.log.debug('Send error - ' + error);
            if (~error.indexOf('CLOSED')){
                adapter.setState('info.connection', false, true);
                connect();
            }
        } else {
            adapter.log.debug('Send command:{' + data + '} - OK');
        }
    });  
}

function parse(data){
    var obj;
    try {
        obj = JSON.parse(data);
            if(obj.mode && obj.brightness){
                for (var key in obj) {
                    if(obj.hasOwnProperty(key)){
                        if(key === 'color'){
                            setStates('color_RGB', rgbToHex(obj[key][0], obj[key][1], obj[key][2]));
                        }
                        setStates(key, obj[key]);
                    }
                }
            }
    } catch (err) {
        adapter.log.debug('Error parse - ' + err);
    }
}

function setStates(name, val){
    adapter.getState(name, function (err, state){
        if ((err/* || !state*/)){
            adapter.log.warn('Send this data ' + name);
        } else {
            adapter.setState(name, {val: val, ack: true});
        }
    });
}

function rgbToHex(r, g, b) {
    return componentToHex(r) + componentToHex(g) + componentToHex(b);
}
function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}