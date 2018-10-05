async function spoilsCount(record, db, callback) {
    try {
        const questCol = db.collection("aigisQuest");
        let rec = await questCol.findOne({
            QuestID: record.QuestID
        })
        if (!rec) {
            rec = {
                QuestID: record.QuestID,
                Items: record.DropInfos.map(e => {
                    return {
                        TreasureID: e.Treasure,
                        Probs: {}
                    }
                })
            }
        }
        record.DropInfos.forEach(dropinfo => {
            if (!rec.Items[dropinfo.DropOrder].Probs[dropinfo.Prob]) {
                rec.Items[dropinfo.DropOrder].Probs[dropinfo.Prob] = {
                    Sum: 0,
                    Num: 0
                }
            }
            if(!dropinfo.IsFirst) {
                rec.Items[dropinfo.DropOrder].Probs[dropinfo.Prob].Sum += Math.max(dropinfo.Num, 1);
                rec.Items[dropinfo.DropOrder].Probs[dropinfo.Prob].Num += dropinfo.Num;
            }

        })
        questCol.findOneAndUpdate({
            QuestID: record.QuestID
        }, {
            $set: rec
        }, {
            upsert: true
        }).then((v) => {
            callback(false);
        }).catch((err) => {
            throw err;
        })
    } catch (err) {
        console.log(err);
        callback(true);
    }
}


function aigisStatisticsDep(data, db, callback) {
    switch (data.type) {
        case 'spoils':
            spoilsCount(data.record, db, callback);
            break;
        default:
            break;
    }
}

module.exports = {
    AigisDB: aigisStatisticsDep
}