const express = require('express');
const port = (process.env.PORT || 3000);
const fs = require('fs');
//CREATE EXPRESS APP
const app = express();

const { spawn } = require('child_process');
var child = null; 
var filename = null;
var rootdir = (process.env.ROOTDIR)? process.env.ROOTDIR : './';
var iostatsfilename = null;
var iostatsstream = null;
var iostatchild = null;


// start tcpdump.
app.get('/start', function (req, res) {

    if (!child) {
        filename = rootdir + Date.now().valueOf() + ".pcap"
        console.log('starting tcpdum with file ' + filename);
        child = spawn('/usr/sbin/tcpdump', ['-w', filename]);

        child.stdout.on('data', (chunk) => {
        console.log(chunk.toString());
        });
    
        child.stderr.on('data', (chunk) => {
            console.error(chunk.toString());
        });
    
        child.on('close', (code) => {
            console.log(`tcpdump process exited with code ${code}`);
        });
        res.send('tcpdump started, saving data to: ' + filename);
    } else {
        res.send('tcpdump already started');
    }
  })

  // start tcpdump.
app.get('/startiostat', function (req, res) {

    if (!iostatchild) {
        iostatsfilename = rootdir + "iostat-" + Date.now().valueOf() + ".log"
        iostatsstream = fs.createWriteStream(iostatsfilename, {flags: 'a'});
        console.log('starting iostat and writing output every 2 seconds to: ' + iostatsfilename);
        iostatchild = spawn('/usr/bin/iostat', ['-c', '2']);

        iostatchild.stdout.pipe(iostatsstream);
        iostatchild.stderr.pipe(iostatsstream);
    
        iostatchild.on('close', (code) => {
            console.log(`iostat process exited with code ${code}`);
        });
        res.send('iostat started, saving data to: ' + iostatsfilename);
    } else {
        res.send('iostat already started');
    }
  })


// stop tcpdump.
app.get('/stopiostat', function (req, res) {

    if (iostatchild) {
 
        iostatchild.kill('SIGHUP');
        iostatchild = null;
        res.send('killing iostat.. ');
    } else {
        res.send('iostat not started');
    }
  })

// stop tcpdump.
app.get('/stop', function (req, res) {

    if (child) {
 
        child.kill('SIGHUP');
        child = null;
        res.send('killing tcpdump.. ');
    } else {
        res.send('tcpdump not started');
    }
  })

// download pcap
app.get('/download', function(req, res){
    if (filename) {
        res.set('Content-Type', 'application/octet-stream');
        res.download(filename); // Set disposition and send it.
    } else {
        res.send('no file present');
    }
});

// download iostat
app.get('/downloadiostat', function(req, res){
    if (iostatsfilename) {
        res.set('Content-Type', 'application/octet-stream');
        res.download(iostatsfilename); // Set disposition and send it.
    } else {
        res.send('no file present');
    }
});

// status
app.get('/status', function(req, res){
    var message = "";
    if (filename) {
        message = "Filename present: " + filename + ". ";
    } else {
        message = "No pcap filename present. ";
    }
    if (child) {
        message = message + "Process running.";
    } else {
        message = message + "No tcpdump process running."
    }
    if (iostatsfilename) {
        message = "Filename present: " + iostatsfilename + ". ";
    } else {
        message = "No iostat output filename present. ";
    }
    if (iostatchild) {
        message = message + "iostat process running.";
    } else {
        message = message + "No iostat process running."
    }
    res.send(message);
});

// list commands
app.get('/list', function(req, res){
    var help = `/status to get status
    /list to get this list
    /start to start tcpdump
    /stop to stop tcpdump
    /startiostat to start iostat
    /stopiostat to stop iostat
    /downloadiostat todownload iostat log
    /download to download pcap file
    `;
        res.send(help);
});


app.listen(port);
console.log("listening to port " + port);

