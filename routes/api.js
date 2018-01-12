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
			res.send(analyze(_data));
		});
	});
});

function analyze(data) {
	var currentLevel = 0;
	var GlobalData;
	init(data);
	function init(data) {
		GlobalData = data;
		_.each(data, item => {
			currentLevel = 0;
			findLevel(item);
			item.level = currentLevel;
		});

		for (var i = 1; i <= currentLevel; i++) {
			getWorkItemLevel(i, data);
		}
	}

	function findLevel(data) {
		if (!data.subWorkItems.length) {
			return;
		}
		currentLevel++;
		_.each(data.subWorkItems, workItem => {
			return findLevel(workItem.workItem);
		});
	}

	function getWorkItemLevel(level, data) {
		_.each(data, item => {
			if (item.level == level) {
				findUnitPrice(item);
			}
		});
	}

	function findUnitPrice(item) {
		if (!item.unitPrice) {
			item.unitPrice = 0;
		}
		_.each(item.subWorkItems, workItem => {
			if (!workItem.unitPrice) {
				workItem.unitPrice = _.clone(_.find(GlobalData, {_id: workItem.workItemId}))["unitPrice"];
			}
			item.unitPrice += workItem.quantity * workItem.unitPrice;
		});
	}
	return GlobalData;
}

function populate(_data, callback) {
	async.each(_data, (item, next) => {
		if (_.compact(item.subWorkItems).length) {
			async.each(item.subWorkItems, (subWorkItem, next) => {
				model.WorkItem.find({_id: subWorkItem.workItemId}, (err, data) => {
					subWorkItem.workItem = JSON.parse(JSON.stringify(data[0]));
					subWorkItem["name"] = subWorkItem.workItem["name"];
					subWorkItem["description"] = subWorkItem.workItem["description"];
					subWorkItem["unit"] = subWorkItem.workItem["unit"];
					subWorkItem["unitPrice"] = subWorkItem.workItem["unitPrice"];
					subWorkItem["subWorkItems"] = subWorkItem.workItem["subWorkItems"];
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
		if (!subWorkItem) {
			return next();
		}
		model.WorkItem.find({_id: subWorkItem.workItemId}, (err, data) => {
			subWorkItem.workItem = JSON.parse(JSON.stringify(data[0]));
			subWorkItem["name"] = subWorkItem.workItem["name"];
			subWorkItem["description"] = subWorkItem.workItem["description"];
			subWorkItem["unit"] = subWorkItem.workItem["unit"];
			subWorkItem["unitPrice"] = subWorkItem.workItem["unitPrice"];
			subWorkItem["subWorkItems"] = subWorkItem.workItem["subWorkItems"];
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
