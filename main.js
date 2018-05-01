'use strict';
var r1, g1, h1, b1, s1, v1, i1, f1, p1, k1, q1, l1, t1, zahln;
var utils =    require(__dirname + '/lib/utils');
var adapter = new utils.Adapter('elzersharkmclighting');
const WebSocket = require('ws');
var ws, state_current = {},list_modes = null, flag = false, isAlive = false;
var pingTimer, timeoutTimer;
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
        
// Mein Script Anfang
// Farben Weiß, Warm Weiß, Weiches Weiß, tageslicht, Kühles Weiß
        if (command == 'temperature')
        {
            if(val === 250) {
            if(state_current.ws2812fx_mode !== 0){
                send('#' + rgbToHex(254, 236, 186));
            } else {
                send('*' + rgbToHex(254, 236, 186));
            }}
            if(val === 455) {
            if(state_current.ws2812fx_mode !== 0){
                send('#' + rgbToHex(254, 186, 82));
            } else {
                send('*' + rgbToHex(254, 186, 82));
            }}
            if(val === 370) {
            if(state_current.ws2812fx_mode !== 0){
                send('#' + rgbToHex(254, 205, 118));
            } else {
                send('*' + rgbToHex(254, 205, 118));
            }}
            if(val === 182) {
            if(state_current.ws2812fx_mode !== 0){
                send('#' + rgbToHex(253, 254, 238));
            } else {
                send('*' + rgbToHex(253, 254, 238));
            }}
            if(val === 153) {
            if(state_current.ws2812fx_mode !== 0){
                send('#' + rgbToHex(243, 252, 254));
            } else {
                send('*' + rgbToHex(243, 252, 254));
            }}
        }
//An/Aus/Dimmen/Effekte schalten        
        if (command == 'dimmer')
	{
            adapter.getState('zahl', function (err, state){
		     if (!err){
            zahln = state.val;
			 }
            });
            if(val === 100 && zahln === 101) {
	    send('=all'); }
	    if(val >= 1 && val <= 99 && zahln === 101) {
            send('%' + val/100*255); }
      
     
          if(zahln >= 1 && zahln <= 57) {
	   zahln = zahln - 1;
           send('/' + zahln); }
            if(val === 0) {
            send('=off'); }
        }

//Farben
        if (command == 'hue'){
    
            setTimeout(function (){
            adapter.getState('hue', function (err, state){
		     if (!err){
            h1 = state.val / 65535;
	    }
            });
            }, 400);  
            setTimeout(function (){
            adapter.getState('saturation', function (err, state){
		    if (!err){
            s1 = state.val / 254;
		    }
            });
            }, 400);            
            setTimeout(function (){
            adapter.getState('dimmer', function (err, state){
		    if (!err){
            v1 = state.val / 100;
		    }
            });
            }, 400);			
            setTimeout(function (){
				
			i1 = Math.floor(h1 * 6);
			f1 = h1 * 6 - i1;
			p1 = (1 - s1) * v1;
			k1 = f1 * s1;
			q1 = (1 - k1) * v1;
			l1 = (1 - f1) * s1;
			t1 = (1 - l1) * v1;
			if (i1 == 0) {
			r1 = v1 * 255;
			g1 = t1 * 255;
			b1 = p1 * 255;
			} else if (i1 == 1) {
			r1 = q1 * 255;
			g1 = v1 * 255;
			b1 = p1 * 255;
			} else if (i1 == 2) {
			r1 = p1 * 255;
			g1 = v1 * 255;
			b1 = t1 * 255;
			} else if (i1 == 3) {
			r1 = p1 * 255;
			g1 = q1 * 255;
			b1 = v1 * 255;
			} else if (i1 == 4) {
			r1 = t1 * 255;
			g1 = p1 * 255;
			b1 = v1 * 255;
			} else if (i1 == 5) {
			r1 = v1 * 255;
			g1 = p1 * 255;
			b1 = q1 * 255;
			}	
            }, 500);

            setTimeout(function (){


            if(state_current.ws2812fx_mode !== 0){
                send('#' + rgbToHex(Math.round(r1), Math.round(g1), Math.round(b1)));
            } else {
                send('*' + rgbToHex(Math.round(r1), Math.round(g1), Math.round(b1)));
            }			
	    }, 600);
		      }

// Mein Script Ende        
        
        if (command == 'fx_mode'){
            send('/' + val);
        }
        if (command == 'color'){
            var c = val.split(",");
            if(state_current.ws2812fx_mode !== 0){
                send('#' + rgbToHex(parseInt(c[0]), parseInt(c[1]), parseInt(c[2])));
            } else {
                send('*' + rgbToHex(parseInt(c[0]), parseInt(c[1]), parseInt(c[2])));
            }
        }
        if (command == 'color_R' || command == 'color_G' || command == 'color_B'){
            if(!flag){
                flag = true;
                setTimeout(function (){
                    var r, g, b;
                    adapter.getState('color_R', function (err, state){
                        if (!err){
                            r = state.val;
                            adapter.getState('color_G', function (err, state){
                                if (!err){
                                    g = state.val;
                                    adapter.getState('color_B', function (err, state){
                                        if (!err){
                                            b = state.val;
                                            if (state_current.ws2812fx_mode !== 0){
                                                send('#' + rgbToHex(r, g, b));
                                            } else {
                                                send('*' + rgbToHex(r, g, b));
                                            }
                                            send('$');
                                        }
                                    });
                                }
                            });
                        }
                    });
                    flag = false;
                }, 1000);
            }
        }
        if (command == 'color_RGB'){
            val = val.replace('#', '');
            if(state_current.ws2812fx_mode !== 0){
                send('#' + val);
            } else {
                send('*' + val);
            }
        }
        if (command == 'set_all_RGB'){
            val = val.replace('#', '');
            send('*' + val);
        }
        if (command == 'single_RGB'){
            val = val.replace('#', '');
            send('!' + val);
        }
        if (command == 'array_RGB'){
            if(~val.indexOf('+')){
                if(val[0] === '+'){
                    send(val);
                } else {
                    send('+' + val);
                }
            } else {
                val = val.replace(/\s/g, '').replace(',', '+').replace('[', '').replace(']', '');
                adapter.log.debug('Send array_RGB: ' + val);
                send('+' + val);
            }
        }
        if (command == 'rang_RGB'){
            if(~val.indexOf('R')){
                if(val[0] === 'R'){
                    send(val);
                } else {
                    send('R' + val);
                }
            } else {
                val = val.replace(/\s/g, '').replace(',', 'R').replace('[', '').replace(']', '');
                adapter.log.debug('Send rang_RGB: ' + val);
                send('R' + val);
            }
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
        if(!flag){
           send('$');
        }
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
    var smart = adapter.config.smart ? adapter.config.smart : 'Streifen';
	
	
	//Test
	


// adapter.setState([context.id, 'effect'].join('.'), {val: context.finalLS[finalState] === 'colorloop', ack: true});

	//Test
    adapter.log.info('ElzersharkMcLighting connect to: ' + host + ':' + port);

    ws = new WebSocket('ws://' + host + ':' + port,{
        perMessageDeflate : false
    });

    ws.on('open', function open() {
        adapter.log.info(ws.url + ' ElzersharkMcLighting connected');
        send('$');
        setTimeout(function (){
            send('~');
        }, 5000);
        pingTimer = setInterval(function () {
            ws.ping('ping', function ack(error) {});
        }, 10000);
        timeoutTimer = setInterval(function () {
            if (!isAlive) {
                ws.close();
            }
            else {
                isAlive = false;
            }
        }, 60000);
    });

    ws.on('message', function incoming(data) {
        adapter.log.debug('message - ' + data);
        isAlive = true;
        if(data === 'Connected'){
            adapter.setState('info.connection', true, true);
        }
        parse(data);
    });

    ws.on('error', function incoming(data) {
        adapter.log.debug('Error WS - ' + data);
    });
    ws.on('close', function incoming(data) {
        clearInterval(pingTimer);
        clearInterval(timeoutTimer);
        adapter.log.debug('ERROR! WS CLOSE, CODE - ' + data);
        adapter.setState('info.connection', false, true);
        adapter.log.debug('ElzersharkMcLighting reconnect after 10 seconds');
        setTimeout(connect, 10000);
    });
    ws.on('pong', function(data) {
        isAlive = true;
        adapter.log.debug(ws.url + ' receive a pong : ' + data);
    });
};

function main() {
    adapter.subscribeStates('*');
    connect();
}

function send(data){
    ws.send(data, function ack(error) {
            if(error){
                adapter.log.error('Send command: {' + data + '}, ERROR - ' + error);
                if (~error.toString().indexOf('CLOSED')){
                    adapter.setState('info.connection', false, true);
                    connect();
                }
            } else {
                adapter.log.debug('Send command:{' + data + '}');
            }
    });
}

function parse(data){
    var obj;
    try {
        obj = JSON.parse(data);
            if(obj.mode && obj.brightness){
                state_current = obj;
                for (var key in obj) {
                    if(obj.hasOwnProperty(key)){
                        if(key === 'color'){
				            setTimeout(function (){
                            setStates('color_RGB', rgbToHex(obj[key][0], obj[key][1], obj[key][2]));
                            setStates('color_R', obj[key][0]);
                            setStates('color_G', obj[key][1]);
                            setStates('color_B', obj[key][2]);
			    setStates('zahl', 101);
			    setStates('hue', '', {smartName: {
          de: smart
        }});
		    
			            }, 1400);  		    
					    
					    
					    }
                        setStates(key, obj[key]);
                    }
                    if(key === 'ws2812fx_mode'){
                        setStates('fx_mode', obj[key]);
                    }
                    if(key === 'ws2812fx_mode_name'){
                        setStates('fx_mode_name', obj[key]);
                    }

                }
            }
            if(typeof obj[0] === 'object'){
                setStates('list_modes', obj);
                list_modes = obj;
            }
    } catch (err) {
        adapter.log.debug('Error parse - ' + err);
    }
}

function setStates(name, val){
    adapter.getState(name, function (err, state){
        if ((err)){
            adapter.log.warn('Send this data developers ' + name);
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
