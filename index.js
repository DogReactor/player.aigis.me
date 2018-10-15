const express = require('express');
const app = express();
const path = require('path');
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://localhost:27017';
const assert = require('assert');
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const process = require('child_process');
const { AigisDB } = require('./aigisstatistics')
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('public'));

function createFolder() {

}

app.get('/plugins', (req, res) => {
    const client = new MongoClient(url);
    client.connect().then(() => {
        const db = client.db('player');
        const col = db.collection('plugins');
        col.find({}).toArray().then((result) => {
            client.close();
            res.send(result);
        })
    }).catch((err) => {
        res.send({ error: true });
        client.close();
    })
});
app.post('/reg', (req, res) => {
    const client = new MongoClient(url);
    client.connect((err) => {
        assert.equal(null, err);
        const db = client.db('player');
        const col = db.collection('users');
        col.insertOne({ author: req.body.author, password: req.body.password }).then((r) => {
            res.send('ok');
            client.close();
        }).catch((err) => {
            res.send('auther name has been used');
            client.close();
        })
    })

});
app.post('/statistics/aigis',(req,res)=>{
    const client = new MongoClient(url);
    client.connect((err) => {
        const db = client.db('player');
        AigisDB(req.body, db, err=>{
            if(!err) {
                res.send({res:'ok', err:false});
                
            } else {
                res.send({err:err})
            }
            client.close();
        })
    })
})
app.post('/delplugin', (req, res) => {
    const client = new MongoClient(url);
    client.connect().then(() => {
        const db = client.db('player');
        const usr = db.collection('users');
        db.collection('plugins').findOne({ path: req.body.plugin }).then((result) => {
            if (result !== null) {
                usr.findOne({author:result.author}).then(plauthor=>{
                    if (req.body.authorsAvaliable[plauthor.author] && req.body.authorsAvaliable[result.author]===plauthor.password) {
                        try {    
                            const pluginDir = path.join('./public/assets/plugins', result.path);
                            const command = 'rm -rf ' + pluginDir;
                            process.exec(command, function (error, stdout, stderr) {
                                if (error) {
                                    throw error
                                } else {
                                    db.collection('plugins').deleteOne({ path: req.body.plugin });
                                    res.send('ok');
                                    client.close();
                                }
                            });
                        } catch (err) {                     
                            res.send('Err in deleting plugin');
                            client.close();
                            console.log(err);
                        }
                    } else {
                        res.send('You aren\'t authorized to delete this plugin');
                        client.close();
                    }
                })
                
            } else {
                res.send('No such plugin');
                client.close();
            }
        })
    }).catch((err) => {
        res.send({ err });
        client.close();
    })
});
app.post('/plugins', (req, res) => {
    // author password name
    const client = new MongoClient(url);
    client.connect().then(() => {
        const db = client.db('player');
        db.collection('users').findOne({ author: req.query.author }).then((r) => {
            if (r === null) {
                res.send('author not reged'); console.log('no author');
                client.close();
                return;
            }
            if (r.password !== req.query.password) {
                res.send('password wrong'); console.log('password wrong');
                client.close();
                return;
            }
            db.collection('plugins').findOne({ name: req.query.name }).then((r) => {
                if (r === null || r.author === req.query.author) {
                    const dir = path.join('./public/assets/plugins', req.query.name, req.query.version);
                    fs.ensureDirSync(dir);
                    const ws = fs.createWriteStream(path.join(dir, `${req.query.name}.zip`));
                    req.pipe(ws);
                    req.on('end', () => {
                        db.collection('plugins').findOneAndUpdate({ path: req.query.name }, {
                            $set: {
                                path: req.query.name,
                                author: req.query.author,
                                description: req.query.description,
                                version: req.query.version,
                                pluginName: req.query.pluginName
                            }
                        }, { upsert: true }).then((v) => {
                            client.close();
                            res.send('ok');
                        }).catch((err) => {
                            res.send(err); console.log(err);
                            client.close();
                            return;
                        })
                    })
                } else {
                    res.send('plugin name has been used'); console.log('plugin name has been used');
                    client.close();
                    return;
                }
            });
        });
    }).catch((err) => {
        res.send(err);
        client.close();
        return;
    })
});

app.get('/fuckyouthisshitisinit', (req, res) => {
    const client = new MongoClient(url);
    client.connect((err) => {
        assert.equal(null, err);
        const db = client.db('player');
        db.collection('users').createIndex({ "author": 1 }, { unique: true }, (err, result) => {
            res.send('ok');
        });
    });
})

app.listen(3000);