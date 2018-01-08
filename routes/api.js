var express = require('express');
var router = express.Router();
var model = require('./db');
var async = require('async');
var _ = require('lodash');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/GetWorkItems', function(req, res, next) {
	let query = JSON.parse(JSON.stringify(req.query));

	model.WorkItem.find(query)
		//.populate('subWorkItems.workItemId')
		.exec((err, data) => {
		if (err) {
			return res.send(err);
		}
		populate(JSON.parse(JSON.stringify(data)), (err, _data) => {
			res.send(_data);
		});
	});
});

function populate(_data, callback) {
	async.each(_data, (item, next) => {
		if (_.compact(item.subWorkItems).length) {
			async.each(item.subWorkItems, (subWorkItem, next) => {
				model.WorkItem.find({_id: subWorkItem.workItemId}, (err, data) => {
					subWorkItem.workItem = JSON.parse(JSON.stringify(data[0]));
					if (subWorkItem.workItem.subWorkItems.length) {
						subPopulate(subWorkItem.workItem.subWorkItems, (err, _data) => {
							next();
						});
					} else {
						next();
					}
				});
			}, () => {
				next();
			});
		} else {
			next();
		}
	}, () => {
		callback(null, _data)
	});
}

function subPopulate(data, callback) {
	async.each(data, (subWorkItem, next) => {
		model.WorkItem.find({_id: subWorkItem.workItemId}, (err, data) => {
			subWorkItem.workItem = JSON.parse(JSON.stringify(data[0]));
			if (subWorkItem.workItem.subWorkItems.length) {
				subPopulate(subWorkItem.workItem.subWorkItems, (err, _data) => {
					next();
				});
			} else {
				next();
			}
		});
	}, () => {
		callback();
	});
}

router.post('/AddWorkItem', function(req, res, next) {
	model.WorkItem.findOneAndUpdate({name: req.body.name}, req.body, { upsert: true }, function(err, doc) {
    if (err) {
    	return res.status(500).send({ error: err });
    }

    return res.send({msg: "success", result: doc })
	});
});

module.exports = router;
